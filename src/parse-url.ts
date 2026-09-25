/**
 * Split any common Git remote notation into transport, host, port and path segments.
 * Provider-specific path rules live in providers.ts.
 */
import type { GitTransport } from './types.js';

export interface ParsedGitUrl {
  transport: GitTransport;
  /** SSH login name such as `git`; never kept for HTTP(S), where it may be a token. */
  user?: string;
  host: string;
  port?: string;
  /** Path segments without the `.git` suffix, query or fragment. */
  segments: string[];
  /** Raw path and query of an HTTP(S) page URL, used to recognize which page it is. */
  route?: string;
}

const schemes: Record<string, GitTransport> = {
  https: 'https',
  http: 'http',
  ssh: 'ssh',
  git: 'git',
  'git+ssh': 'ssh',
  'ssh+git': 'ssh',
  'git+https': 'https',
  'git+http': 'http',
};

const defaultPorts: Record<GitTransport, string> = { https: '443', http: '80', ssh: '22', git: '9418' };

const build = (
  transport: GitTransport,
  user: string | undefined,
  host: string,
  port: string | undefined,
  path: string
): ParsedGitUrl | undefined => {
  const segments = (path.split(/[?#]/)[0] ?? '').split('/').filter(Boolean);
  const last = segments.at(-1);
  if (last?.endsWith('.git')) {
    segments[segments.length - 1] = last.slice(0, -'.git'.length);
  }
  if (!host || segments.length === 0 || segments.at(-1) === '') {
    return undefined;
  }
  const parsed: ParsedGitUrl = { transport, host: host.toLowerCase(), segments };
  if (user && (transport === 'ssh' || transport === 'git')) {
    parsed.user = user;
  }
  if (port && port !== defaultPorts[transport]) {
    parsed.port = port;
  }
  if (transport === 'https' || transport === 'http') {
    parsed.route = path.split('#')[0] ?? '';
  }
  return parsed;
};

/** Scheme URLs go through the WHATWG URL parser, available in Node.js and browsers alike. */
const fromUrl = (transport: GitTransport, value: string): ParsedGitUrl | undefined => {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return undefined;
  }
  const user = url.username ? decodeURIComponent(url.username) : undefined;
  return build(transport, user, url.hostname, url.port || undefined, `${url.pathname}${url.search}`);
};

export const parseGitUrl = (input: string): ParsedGitUrl | undefined => {
  const value = input.trim();
  if (!value || /\s/.test(value)) {
    return undefined;
  }
  const scheme = /^([a-z][a-z0-9+.-]*):\/\//i.exec(value);
  if (scheme) {
    const transport = schemes[scheme[1]!.toLowerCase()];
    return transport ? fromUrl(transport, value) : undefined;
  }
  // scp-like `[user@]host:path`; a one-letter host is a Windows drive, not a remote.
  const scp = /^(?:([^@/]+)@)?([^@/:]{2,}):(?!\/\/)(.+)$/.exec(value);
  if (scp) {
    return build('ssh', scp[1], scp[2]!, undefined, scp[3]!);
  }
  // A page address copied without its scheme, e.g. `github.com/owner/repo`.
  const bare = /^([a-z0-9-]+(?:\.[a-z0-9-]+)+)(?::(\d+))?(\/.+)$/i.exec(value);
  if (bare) {
    return build('https', undefined, bare[1]!, bare[2], bare[3]!);
  }
  return undefined;
};

/** Remove credentials: all user info for HTTP(S), the password part for other schemes. */
export const sanitizeGitUrl = (input: string): string => {
  const value = input.trim();
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(value)) {
    // scp-like addresses carry a login name only, never a password.
    return value;
  }
  try {
    const url = new URL(value);
    url.password = '';
    if (/^(git\+)?https?:$/i.test(url.protocol)) {
      url.username = '';
    }
    return url.href;
  } catch {
    return value;
  }
};
