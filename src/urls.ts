/**
 * Build web links from a parsed remote's templates. Paths are encoded per segment by path-to-regexp,
 * keeping `/` inside branch names and file paths; query values are encoded by URLSearchParams.
 */
import { buildRoute, toRoute, type RefKey } from './route.js';
import type { GitRemote, GitRemoteUrls, GitUrlKind } from './types.js';

/** Repository values of a remote, inserted into templates as they are. */
export const repositoryValues = (remote: GitRemote): Record<string, string> => ({
  origin: remote.origin,
  host: remote.host,
  repo: remote.path,
  owner: remote.owner,
  name: remote.name,
  org: remote.path.split('/')[0] ?? '',
});

/** A file path may be written with a leading `./` or `/`; links need it relative to the repository root. */
const normalizeFile = (file: string): string => file.replace(/^(\.?\/)+/, '');

/** Web links of a parsed remote; kinds the provider does not support are absent. */
export const urls = (remote: GitRemote): GitRemoteUrls => {
  const raw = repositoryValues(remote);
  const has = (kind: GitUrlKind): boolean => remote.templates[kind] !== undefined;
  const build = (kind: GitUrlKind, values: Partial<Record<RefKey, string>> = {}): string =>
    buildRoute(toRoute(remote.templates[kind]!, raw), values);
  const fileLink = (kind: GitUrlKind) => (ref: string, file: string) => build(kind, { ref, file: normalizeFile(file) });

  const result: GitRemoteUrls = {
    repository: has('repository') ? build('repository') : `${remote.origin}/${remote.path}`,
  };
  if (has('owner')) {
    result.owner = build('owner');
  }
  if (has('cloneHttps')) {
    result.cloneHttps = build('cloneHttps');
  }
  // An SSH input already is the SSH clone URL, including hosts and ports a template cannot know.
  if (remote.transport === 'ssh') {
    result.cloneSsh = remote.url;
  } else if (has('cloneSsh')) {
    result.cloneSsh = build('cloneSsh');
  }
  if (has('branches')) {
    result.branches = build('branches');
  }
  if (has('tags')) {
    result.tags = build('tags');
  }
  if (has('branch')) {
    result.branch = (branch) => build('branch', { branch });
  }
  if (has('commits')) {
    result.commits = (ref) => build('commits', { ref });
  }
  if (has('tag')) {
    result.tag = (tag) => build('tag', { tag });
  }
  if (has('commit')) {
    result.commit = (id) => build('commit', { id });
  }
  if (has('compare')) {
    result.compare = (base, head) => build('compare', { base, head });
  }
  if (has('file')) {
    result.file = fileLink('file');
  }
  if (has('raw')) {
    result.raw = fileLink('raw');
  }
  if (has('blame')) {
    result.blame = fileLink('blame');
  }
  if (has('history')) {
    result.history = fileLink('history');
  }
  return result;
};
