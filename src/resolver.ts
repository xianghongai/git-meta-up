/**
 * Resolve a remote URL to its provider. Registered configs win over built-in hosts, and later registrations win
 * over earlier ones; registration only affects its own resolver instance.
 */
import { matchPage } from './page.js';
import { parseGitUrl, sanitizeGitUrl } from './parse-url.js';
import { detectByPath, hostAliases, knownHosts, providers } from './providers.js';
import { gitProviderTypes, type GitProviderType, type GitRemote, type GitRemoteConfig } from './types.js';
import { urls } from './urls.js';

export interface GitMetaUp {
  register(...remotes: GitRemoteConfig[]): GitMetaUp;
  parse(url: string): GitRemote | undefined;
  urls: typeof urls;
}

export interface GitMetaUpOptions {
  remotes?: GitRemoteConfig[];
}

/** Accept `domain` written as a host, `host:port` or a full URL, and reject unknown types early. */
const normalizeConfig = (config: GitRemoteConfig): GitRemoteConfig => {
  const domain = String(config.domain ?? '')
    .trim()
    .toLowerCase()
    .replace(/^[a-z][a-z0-9+.-]*:\/\//, '')
    .replace(/[/?#].*$/, '');
  if (!domain) {
    throw new TypeError('git-meta-up: remote config requires a domain');
  }
  if (!gitProviderTypes.includes(config.type)) {
    throw new TypeError(
      `git-meta-up: unknown provider type "${String(config.type)}" for ${domain}; expected one of ${gitProviderTypes.join(', ')}`
    );
  }
  return { ...config, domain };
};

const matches = (domain: string, host: string, port: string | undefined): boolean =>
  domain === host || host.endsWith(`.${domain}`) || (port !== undefined && domain === `${host}:${port}`);

const resolve = (url: string, remotes: readonly GitRemoteConfig[]): GitRemote | undefined => {
  const parsed = parseGitUrl(url);
  if (!parsed) {
    return undefined;
  }
  const host = hostAliases[parsed.host] ?? parsed.host;
  const config = remotes.findLast((remote) => matches(remote.domain, host, parsed.port));
  const type: GitProviderType | undefined =
    config?.type ??
    knownHosts[host] ??
    (host.endsWith('.visualstudio.com') ? 'AzureDevOps' : undefined) ??
    detectByPath(host, parsed.segments);
  if (!type) {
    return undefined;
  }
  const provider = providers[type];
  const location = provider.locate(host, parsed.segments);
  if (!location) {
    return undefined;
  }
  const protocol = config?.protocol ?? (parsed.transport === 'http' ? 'http' : 'https');
  // An SSH port belongs to the SSH service, not to the web pages.
  const port = parsed.port && (parsed.transport === 'https' || parsed.transport === 'http') ? `:${parsed.port}` : '';
  const prefix = location.prefix.length > 0 ? `/${location.prefix.join('/')}` : '';
  const templates = type === 'Custom' ? { ...provider.templates, ...config?.urls } : { ...provider.templates };
  const remote: GitRemote = {
    provider: { type, name: config?.name ?? provider.name },
    transport: parsed.transport,
    host: location.host,
    origin: `${protocol}://${location.host}${port}${prefix}`,
    path: location.path.join('/'),
    owner: location.owner,
    name: location.name,
    url: sanitizeGitUrl(url),
    templates,
  };
  if (parsed.route === undefined) {
    return remote;
  }
  // A Custom provider has no route marker, so the repository path is the shortest one whose remainder
  // matches one of its page templates; otherwise the whole path is the repository.
  if (type === 'Custom') {
    for (let length = 2; length < location.path.length; length += 1) {
      const path = location.path.slice(0, length);
      const candidate: GitRemote = {
        ...remote,
        path: path.join('/'),
        owner: path.slice(0, -1).join('/'),
        name: path.at(-1)!,
      };
      const page = matchPage(candidate, parsed.route);
      if (page && page.kind !== 'repository') {
        return { ...candidate, page };
      }
    }
  }
  const page = matchPage(remote, parsed.route);
  if (page) {
    remote.page = page;
  }
  return remote;
};

export const createGitMetaUp = (options: GitMetaUpOptions = {}): GitMetaUp => {
  const remotes = (options.remotes ?? []).map(normalizeConfig);
  const resolver: GitMetaUp = {
    register(...configs) {
      remotes.push(...configs.map(normalizeConfig));
      return resolver;
    },
    parse: (url) => resolve(url, remotes),
    urls,
  };
  return resolver;
};

const builtIn = createGitMetaUp();

/** Parse with built-in providers only; use createGitMetaUp() to register self-hosted domains. */
export const parse = (url: string): GitRemote | undefined => builtIn.parse(url);
