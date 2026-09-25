import { snakeCase } from 'change-case';
import { snakeCase as snakeCaseObjectKeys } from 'change-case/keys';
import { createGitMetaUp, sanitizeGitUrl, type GitPage, type GitRemoteConfig, type GitRemoteUrls } from 'git-meta-up';

export interface Resolution {
  /** Shown in the JSON output. */
  output: unknown;
  /** Links shown under the output; only web pages are clickable. */
  links: Array<[kind: string, url: string]>;
  provider?: string;
  configError?: string;
}

/** The output is shown with snake_case property names at every level; values are kept as they are. */
const snakeCaseKeys = (value: object): unknown => snakeCaseObjectKeys(value, Infinity);

export const readConfig = (text: string): GitRemoteConfig[] => {
  if (!text.trim()) {
    return [];
  }
  const value: unknown = JSON.parse(text);
  if (!Array.isArray(value)) {
    throw new TypeError('The config must be a JSON array of remotes.');
  }
  return value as GitRemoteConfig[];
};

/**
 * Links for the parsed remote. Ref-free links are always listed; the others use the branch, tag, commit,
 * file or comparison read from the pasted page URL.
 */
const pageLinks = (builders: GitRemoteUrls, page: GitPage | undefined): Record<string, string | undefined> => {
  const ref = page?.ref ?? page?.branch ?? page?.tag ?? page?.id;
  const file = page?.file;
  return {
    repository: builders.repository,
    owner: builders.owner,
    cloneHttps: builders.cloneHttps,
    cloneSsh: builders.cloneSsh,
    branches: builders.branches,
    tags: builders.tags,
    branch: page?.branch ? builders.branch?.(page.branch) : undefined,
    tag: page?.tag ? builders.tag?.(page.tag) : undefined,
    commits: ref ? builders.commits?.(ref) : undefined,
    commit: page?.id ? builders.commit?.(page.id) : undefined,
    compare: page?.base && page.head ? builders.compare?.(page.base, page.head) : undefined,
    file: ref && file ? builders.file?.(ref, file) : undefined,
    raw: ref && file ? builders.raw?.(ref, file) : undefined,
    blame: ref && file ? builders.blame?.(ref, file) : undefined,
    history: ref && file ? builders.history?.(ref, file) : undefined,
  };
};

/** Explain why a URL was not recognized, e.g. a configured domain without a repository path. */
const unrecognizedHint = (url: string, remotes: GitRemoteConfig[]): string => {
  const host = /^(?:[a-z][a-z0-9+.-]*:\/\/)?(?:[^@/]*@)?([^/:?#\s]+)/i.exec(url.trim())?.[1]?.toLowerCase();
  const config = host
    ? remotes.findLast((remote) => {
        const domain = String(remote.domain).toLowerCase();
        return host === domain || host.endsWith(`.${domain}`);
      })
    : undefined;
  if (host && config) {
    return `${host} matches the "${config.name ?? config.type}" remote config, but a repository URL also needs its path, e.g. https://${host}/owner/repo.git`;
  }
  return 'Check the URL, or register its domain in the remote config.';
};

export const resolve = (url: string, configText: string): Resolution => {
  let remotes: GitRemoteConfig[];
  let resolver;
  try {
    remotes = readConfig(configText);
    resolver = createGitMetaUp({ remotes });
  } catch (error) {
    const configError = error instanceof Error ? error.message : String(error);
    return { output: snakeCaseKeys({ error: 'Invalid remote config', detail: configError }), links: [], configError };
  }
  const remote = resolver.parse(url);
  if (!remote) {
    return {
      output: snakeCaseKeys({
        error: 'Unrecognized remote',
        hint: unrecognizedHint(url, remotes),
        input: sanitizeGitUrl(url),
      }),
      links: [],
    };
  }
  const links = pageLinks(resolver.urls(remote), remote.page);
  return {
    output: snakeCaseKeys({ remote, urls: links }),
    links: Object.entries(links)
      .filter((entry): entry is [string, string] => entry[1] !== undefined)
      .map(([kind, href]) => [snakeCase(kind), href] as [string, string]),
    provider: remote.provider.name,
  };
};
