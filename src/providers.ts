/**
 * Built-in providers: how a host is recognized, where the repository path ends, and the web link templates.
 */
import type { GitProviderType, GitUrlTemplates } from './types.js';

export interface RepositoryLocation {
  /** Web host after SSH aliases are mapped, e.g. ssh.github.com → github.com. */
  host: string;
  /** Path segments kept in the origin, such as a Bitbucket Server context path. */
  prefix: string[];
  /** Repository path segments under the origin. */
  path: string[];
  owner: string;
  name: string;
}

type Locate = (host: string, segments: string[]) => RepositoryLocation | undefined;

const at = (host: string, path: string[], prefix: string[] = []): RepositoryLocation | undefined =>
  path.length < 2 ? undefined : { host, prefix, path, owner: path.slice(0, -1).join('/'), name: path.at(-1)! };

/** `owner/repo` hosts: anything after the second segment is a page route. */
const ownerRepo: Locate = (host, segments) => at(host, segments.slice(0, 2));

/** Nested groups; page routes start after a `-` segment (`/-/tree/main`). */
const dashRoutes: Locate = (host, segments) => {
  const end = segments.indexOf('-');
  return at(host, end < 0 ? segments : segments.slice(0, end));
};

const codeupRoutes = new Set([
  'tree',
  'blob',
  'raw',
  'commit',
  'commits',
  'branches',
  'tags',
  'compare',
  'merge_requests',
  'pipeline',
  'quality',
  'insight',
  'activity',
  'members',
  'settings',
]);

/** Nested groups under an organization ID; page routes have no marker, so known route names end the path. */
const codeup: Locate = (host, segments) => {
  const end = segments.findIndex((segment, index) => index >= 2 && codeupRoutes.has(segment));
  return at(host, end < 0 ? segments : segments.slice(0, end));
};

/**
 * `{org}/{project}/_git/{repo}` on dev.azure.com, `{project}/_git/{repo}` on `{org}.visualstudio.com`,
 * and `v3/{org}/{project}/{repo}` over SSH. Azure DevOps Server keeps its collection path before the project.
 */
const azure: Locate = (host, segments) => {
  if (segments[0] === 'v3' && segments.length >= 4) {
    const [, org, project, repo] = segments as [string, string, string, string];
    return host === 'vs-ssh.visualstudio.com'
      ? { host: `${org}.visualstudio.com`, prefix: [], path: [project, '_git', repo], owner: project, name: repo }
      : {
          host: 'dev.azure.com',
          prefix: [],
          path: [org, project, '_git', repo],
          owner: `${org}/${project}`,
          name: repo,
        };
  }
  const git = segments.indexOf('_git');
  const name = segments[git + 1];
  if (git < 0 || !name) {
    return undefined;
  }
  const owner = segments.slice(0, git).join('/');
  return { host, prefix: [], path: segments.slice(0, git + 2), owner, name };
};

/**
 * Clone URLs `/scm/{project}/{repo}`, pages `/projects/{project}/repos/{repo}`, SSH `/{project}/{repo}`.
 * Anything before `scm` or `projects` is the server's context path.
 */
const bitbucketServer: Locate = (host, segments) => {
  const scm = segments.indexOf('scm');
  if (scm >= 0 && segments.length >= scm + 3) {
    const [owner, name] = segments.slice(scm + 1, scm + 3) as [string, string];
    return { host, prefix: segments.slice(0, scm), path: [owner, name], owner, name };
  }
  const projects = segments.findIndex(
    (segment, index) => (segment === 'projects' || segment === 'users') && segments[index + 2] === 'repos'
  );
  if (projects >= 0 && segments.length >= projects + 4) {
    const owner = segments[projects + 1]!;
    const name = segments[projects + 3]!;
    return { host, prefix: segments.slice(0, projects), path: [owner, name], owner, name };
  }
  return ownerRepo(host, segments);
};

const whole: Locate = (host, segments) => at(host, segments);

const repo = '${origin}/${repo}';
const ssh = 'git@${host}:${repo}.git';

export interface ProviderDefinition {
  name: string;
  locate: Locate;
  templates: GitUrlTemplates;
}

/**
 * Templates follow each provider's own pages. Providers whose routes need the ref type (Gitea, Azure DevOps,
 * Bitbucket Server) treat `${ref}` as a branch; kinds a provider lacks are left out.
 */
export const providers: Record<GitProviderType, ProviderDefinition> = {
  GitHub: {
    name: 'GitHub',
    locate: ownerRepo,
    templates: {
      repository: repo,
      owner: '${origin}/${owner}',
      cloneHttps: `${repo}.git`,
      cloneSsh: ssh,
      branches: `${repo}/branches`,
      branch: `${repo}/tree/\${branch}`,
      commits: `${repo}/commits/\${ref}`,
      tags: `${repo}/tags`,
      tag: `${repo}/releases/tag/\${tag}`,
      commit: `${repo}/commit/\${id}`,
      compare: `${repo}/compare/\${base}...\${head}`,
      file: `${repo}/blob/\${ref}/\${file}`,
      raw: `${repo}/raw/\${ref}/\${file}`,
      blame: `${repo}/blame/\${ref}/\${file}`,
      history: `${repo}/commits/\${ref}/\${file}`,
    },
  },
  GitLab: {
    name: 'GitLab',
    locate: dashRoutes,
    templates: {
      repository: repo,
      owner: '${origin}/${owner}',
      cloneHttps: `${repo}.git`,
      cloneSsh: ssh,
      branches: `${repo}/-/branches`,
      branch: `${repo}/-/tree/\${branch}`,
      commits: `${repo}/-/commits/\${ref}`,
      tags: `${repo}/-/tags`,
      tag: `${repo}/-/tags/\${tag}`,
      commit: `${repo}/-/commit/\${id}`,
      compare: `${repo}/-/compare/\${base}...\${head}`,
      file: `${repo}/-/blob/\${ref}/\${file}`,
      raw: `${repo}/-/raw/\${ref}/\${file}`,
      blame: `${repo}/-/blob/\${ref}/\${file}?blame=1`,
      history: `${repo}/-/commits/\${ref}/\${file}`,
    },
  },
  Gitea: {
    name: 'Gitea',
    locate: ownerRepo,
    // Gitea routes carry the ref type (`/src/branch/…`); `${ref}` is treated as a branch.
    templates: {
      repository: repo,
      owner: '${origin}/${owner}',
      cloneHttps: `${repo}.git`,
      cloneSsh: ssh,
      branches: `${repo}/branches`,
      branch: `${repo}/src/branch/\${branch}`,
      commits: `${repo}/commits/branch/\${ref}`,
      tags: `${repo}/tags`,
      tag: `${repo}/releases/tag/\${tag}`,
      commit: `${repo}/commit/\${id}`,
      compare: `${repo}/compare/\${base}...\${head}`,
      file: `${repo}/src/branch/\${ref}/\${file}`,
      raw: `${repo}/raw/branch/\${ref}/\${file}`,
      blame: `${repo}/blame/branch/\${ref}/\${file}`,
      history: `${repo}/commits/branch/\${ref}/\${file}`,
    },
  },
  Bitbucket: {
    name: 'Bitbucket',
    locate: ownerRepo,
    templates: {
      repository: repo,
      owner: '${origin}/${owner}/',
      cloneHttps: `${repo}.git`,
      cloneSsh: ssh,
      branches: `${repo}/branches/`,
      branch: `${repo}/branch/\${branch}`,
      commits: `${repo}/commits/branch/\${ref}`,
      tags: `${repo}/downloads/?tab=tags`,
      tag: `${repo}/commits/tag/\${tag}`,
      commit: `${repo}/commits/\${id}`,
      compare: `${repo}/branches/compare/\${head}%0D\${base}`,
      file: `${repo}/src/\${ref}/\${file}`,
      raw: `${repo}/raw/\${ref}/\${file}`,
      blame: `${repo}/annotate/\${ref}/\${file}`,
      history: `${repo}/history-node/\${ref}/\${file}`,
    },
  },
  BitbucketServer: {
    name: 'Bitbucket Server',
    locate: bitbucketServer,
    templates: {
      repository: '${origin}/projects/${owner}/repos/${name}/browse',
      owner: '${origin}/projects/${owner}',
      cloneHttps: '${origin}/scm/${owner}/${name}.git',
      branches: '${origin}/projects/${owner}/repos/${name}/branches',
      branch: '${origin}/projects/${owner}/repos/${name}/browse?at=refs%2Fheads%2F${branch}',
      commits: '${origin}/projects/${owner}/repos/${name}/commits?until=${ref}',
      tags: '${origin}/projects/${owner}/repos/${name}/tags',
      tag: '${origin}/projects/${owner}/repos/${name}/browse?at=refs%2Ftags%2F${tag}',
      commit: '${origin}/projects/${owner}/repos/${name}/commits/${id}',
      file: '${origin}/projects/${owner}/repos/${name}/browse/${file}?at=${ref}',
      raw: '${origin}/projects/${owner}/repos/${name}/raw/${file}?at=${ref}',
    },
  },
  AzureDevOps: {
    name: 'Azure DevOps',
    locate: azure,
    templates: {
      repository: repo,
      owner: '${origin}/${owner}',
      cloneHttps: repo,
      branches: `${repo}/branches`,
      branch: `${repo}?version=GB\${branch}`,
      commits: `${repo}/commits?itemVersion=GB\${ref}`,
      tags: `${repo}/tags`,
      tag: `${repo}?version=GT\${tag}`,
      commit: `${repo}/commit/\${id}`,
      file: `${repo}?path=/\${file}&version=GB\${ref}`,
      history: `${repo}?path=/\${file}&version=GB\${ref}&_a=history`,
    },
  },
  Gitee: {
    name: 'Gitee',
    locate: ownerRepo,
    templates: {
      repository: repo,
      owner: '${origin}/${owner}',
      cloneHttps: `${repo}.git`,
      cloneSsh: ssh,
      branches: `${repo}/branches`,
      branch: `${repo}/tree/\${branch}`,
      commits: `${repo}/commits/\${ref}`,
      tags: `${repo}/tags`,
      tag: `${repo}/tree/\${tag}`,
      commit: `${repo}/commit/\${id}`,
      compare: `${repo}/compare/\${base}...\${head}`,
      file: `${repo}/blob/\${ref}/\${file}`,
      raw: `${repo}/raw/\${ref}/\${file}`,
      blame: `${repo}/blame/\${ref}/\${file}`,
      history: `${repo}/commits/\${ref}/\${file}`,
    },
  },
  CNB: {
    name: 'CNB',
    locate: dashRoutes,
    // CNB clones over HTTPS only.
    templates: {
      repository: repo,
      owner: '${origin}/${owner}',
      cloneHttps: repo,
      branches: `${repo}/-/branches`,
      branch: `${repo}/-/tree/\${branch}`,
      commits: `${repo}/-/commits/\${ref}`,
      tags: `${repo}/-/tags`,
      tag: `${repo}/-/releases/tag/\${tag}`,
      commit: `${repo}/-/commit/\${id}`,
      compare: `${repo}/-/compare/\${base}...\${head}`,
      file: `${repo}/-/blob/\${ref}/\${file}`,
      raw: `${repo}/-/git/raw/\${ref}/\${file}`,
      blame: `${repo}/-/blame/\${ref}/\${file}`,
      history: `${repo}/-/commits/\${ref}/\${file}`,
    },
  },
  Codeup: {
    name: 'Codeup',
    locate: codeup,
    // The owner page is the organization; Codeup has no blame page.
    templates: {
      repository: repo,
      owner: '${origin}/${org}',
      cloneHttps: `${repo}.git`,
      cloneSsh: ssh,
      branches: `${repo}/branches`,
      branch: `${repo}/tree/\${branch}`,
      commits: `${repo}/commits/\${ref}`,
      tags: `${repo}/tags`,
      tag: `${repo}/tree/\${tag}`,
      commit: `${repo}/commit/\${id}`,
      compare: `${repo}/compare?from=\${base}&to=\${head}`,
      file: `${repo}/blob/\${ref}/\${file}`,
      raw: `${repo}/raw/\${ref}/\${file}`,
      history: `${repo}/commits/\${ref}/\${file}`,
    },
  },
  Custom: {
    name: 'Custom',
    locate: whole,
    templates: { repository: repo },
  },
};

/** SSH endpoints whose pages live on another host. */
export const hostAliases: Record<string, string> = {
  'ssh.github.com': 'github.com',
  'altssh.gitlab.com': 'gitlab.com',
  'altssh.bitbucket.org': 'bitbucket.org',
  'ssh.dev.azure.com': 'dev.azure.com',
};

export const knownHosts: Record<string, GitProviderType> = {
  'github.com': 'GitHub',
  'gitlab.com': 'GitLab',
  'gitea.com': 'Gitea',
  'codeberg.org': 'Gitea',
  'bitbucket.org': 'Bitbucket',
  'dev.azure.com': 'AzureDevOps',
  'vs-ssh.visualstudio.com': 'AzureDevOps',
  'gitee.com': 'Gitee',
  'cnb.cool': 'CNB',
  'codeup.aliyun.com': 'Codeup',
};

/** Hosts not listed above, recognized by their path layout (Azure DevOps Server, Bitbucket Server). */
export const detectByPath = (host: string, segments: string[]): GitProviderType | undefined => {
  if (host.endsWith('.visualstudio.com') || segments.includes('_git')) {
    return 'AzureDevOps';
  }
  if (
    segments.includes('scm') ||
    segments.some(
      (segment, index) => (segment === 'projects' || segment === 'users') && segments[index + 2] === 'repos'
    )
  ) {
    return 'BitbucketServer';
  }
  return undefined;
};
