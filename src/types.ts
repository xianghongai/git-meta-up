/**
 * Public types. Every value here is plain JSON so a parsed remote can be stored, logged or sent across processes.
 */

export const gitProviderTypes = [
  'GitHub',
  'GitLab',
  'Gitea',
  'Bitbucket',
  'BitbucketServer',
  'AzureDevOps',
  'Gitee',
  'CNB',
  'Codeup',
  'Custom',
] as const;

export type GitProviderType = (typeof gitProviderTypes)[number];

export const gitUrlKinds = [
  'repository',
  'owner',
  'cloneHttps',
  'cloneSsh',
  'branches',
  'branch',
  'commits',
  'tags',
  'tag',
  'commit',
  'compare',
  'file',
  'raw',
  'blame',
  'history',
] as const;

export type GitUrlKind = (typeof gitUrlKinds)[number];

/**
 * Link templates in the GitLens `urls` style. Placeholders: `${origin}`, `${host}`, `${repo}`, `${owner}`,
 * `${name}`, `${org}`, `${branch}`, `${tag}`, `${ref}`, `${id}`, `${file}`, `${base}` and `${head}`.
 * A missing kind means the provider has no such page.
 */
export type GitUrlTemplates = Partial<Record<GitUrlKind, string>>;

/** A self-hosted remote, shaped like an entry of GitLens `gitlens.remotes`. */
export interface GitRemoteConfig {
  /** Host name, optionally with a port. Subdomains match too. */
  domain: string;
  type: GitProviderType;
  /** Display name; defaults to the provider type. */
  name?: string;
  /** Protocol of the web pages; defaults to the remote's own HTTP(S) protocol, otherwise https. */
  protocol?: 'https' | 'http';
  /** Required for `Custom`, ignored by other types. */
  urls?: GitUrlTemplates;
}

export type GitTransport = 'https' | 'http' | 'ssh' | 'git';

/** The page a web URL points at, with the refs and file path read from it. */
export interface GitPage {
  kind: GitUrlKind;
  branch?: string;
  tag?: string;
  /** Branch, tag or commit of commit-history and file pages. */
  ref?: string;
  /** Commit SHA. */
  id?: string;
  file?: string;
  base?: string;
  head?: string;
}

export interface GitRemote {
  provider: { type: GitProviderType; name: string };
  /** How the remote is accessed: HTTP(S), SSH or the git protocol. */
  transport: GitTransport;
  /** Host of the web pages, e.g. github.com for an ssh.github.com remote. */
  host: string;
  /** Origin of the web pages, including an HTTP(S) port or a context path; never credentials. */
  origin: string;
  /** Repository path under the origin, keeping every group level. */
  path: string;
  owner: string;
  name: string;
  /** The input URL with credentials removed, safe to display. */
  url: string;
  /** Present when the input is a recognized web page rather than a clone URL. */
  page?: GitPage;
  templates: GitUrlTemplates;
}

export interface GitRemoteUrls {
  repository: string;
  /** Page of the user, organization or group that owns the repository. */
  owner?: string;
  cloneHttps?: string;
  /** Taken from the input when it is an SSH URL, so custom SSH hosts and ports are kept. */
  cloneSsh?: string;
  branches?: string;
  tags?: string;
  branch?: (name: string) => string;
  /** Commit history of a branch, tag or commit. */
  commits?: (ref: string) => string;
  tag?: (name: string) => string;
  commit?: (id: string) => string;
  compare?: (base: string, head: string) => string;
  /** File pages at a ref; `file` is the path inside the repository. */
  file?: (ref: string, file: string) => string;
  raw?: (ref: string, file: string) => string;
  blame?: (ref: string, file: string) => string;
  history?: (ref: string, file: string) => string;
}
