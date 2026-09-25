import { describe, expect, it } from 'vitest';
import { parse, sanitizeGitUrl } from '../src/index.js';

const pick = (url: string) => {
  const remote = parse(url);
  return (
    remote && {
      type: remote.provider.type,
      origin: remote.origin,
      path: remote.path,
      owner: remote.owner,
      name: remote.name,
    }
  );
};

describe('parse', () => {
  it.each([
    // Nested groups and organization ID paths
    ['https://cnb.cool/org/solutions/team/web/app-web', 'CNB', 'https://cnb.cool', 'org/solutions/team/web/app-web'],
    ['git@gitee.com:owner/app-seed.git', 'Gitee', 'https://gitee.com', 'owner/app-seed'],
    [
      'https://codeup.aliyun.com/5f0000000000000000000000/user/group/repo.git',
      'Codeup',
      'https://codeup.aliyun.com',
      '5f0000000000000000000000/user/group/repo',
    ],
    // Notations
    ['https://github.com/owner/repo.git', 'GitHub', 'https://github.com', 'owner/repo'],
    ['https://github.com/owner/repo/', 'GitHub', 'https://github.com', 'owner/repo'],
    ['git+ssh://git@github.com/owner/repo.git', 'GitHub', 'https://github.com', 'owner/repo'],
    ['ssh://git@ssh.github.com:443/owner/repo.git', 'GitHub', 'https://github.com', 'owner/repo'],
    ['git://gitea.com/owner/repo.git', 'Gitea', 'https://gitea.com', 'owner/repo'],
    ['https://codeberg.org/owner/repo', 'Gitea', 'https://codeberg.org', 'owner/repo'],
    ['git@bitbucket.org:team/repo.git', 'Bitbucket', 'https://bitbucket.org', 'team/repo'],
    ['https://gitlab.com/group/sub/repo.git', 'GitLab', 'https://gitlab.com', 'group/sub/repo'],
    ['github.com/owner/repo', 'GitHub', 'https://github.com', 'owner/repo'],
    // Page URLs copied from the browser still resolve to the repository
    ['https://github.com/owner/repo/tree/feature/x', 'GitHub', 'https://github.com', 'owner/repo'],
    ['https://gitlab.com/group/sub/repo/-/tree/main?ref_type=heads', 'GitLab', 'https://gitlab.com', 'group/sub/repo'],
    ['https://cnb.cool/org/team/repo/-/commit/abc', 'CNB', 'https://cnb.cool', 'org/team/repo'],
    [
      'https://codeup.aliyun.com/5f40/group/repo/commits/main',
      'Codeup',
      'https://codeup.aliyun.com',
      '5f40/group/repo',
    ],
    ['https://gitee.com/owner/repo/tree/master/docs', 'Gitee', 'https://gitee.com', 'owner/repo'],
  ])('%s → %s', (url, type, origin, path) => {
    expect(pick(url)).toMatchObject({ type, origin, path });
  });

  it.each([
    ['https://dev.azure.com/org/project/_git/repo', 'https://dev.azure.com', 'org/project/_git/repo'],
    ['https://org@dev.azure.com/org/project/_git/repo', 'https://dev.azure.com', 'org/project/_git/repo'],
    ['git@ssh.dev.azure.com:v3/org/project/repo', 'https://dev.azure.com', 'org/project/_git/repo'],
    ['https://org.visualstudio.com/project/_git/repo', 'https://org.visualstudio.com', 'project/_git/repo'],
    ['org@vs-ssh.visualstudio.com:v3/org/project/repo', 'https://org.visualstudio.com', 'project/_git/repo'],
    // Azure DevOps Server keeps its collection path in the repository path
    [
      'https://tfs.example.com/tfs/Collection/Project/_git/repo',
      'https://tfs.example.com',
      'tfs/Collection/Project/_git/repo',
    ],
  ])('Azure DevOps %s', (url, origin, path) => {
    expect(pick(url)).toMatchObject({ type: 'AzureDevOps', origin, path, name: 'repo' });
  });

  it.each([
    ['https://bb.example.com/scm/PROJ/repo.git', 'https://bb.example.com'],
    ['https://bb.example.com/bitbucket/scm/PROJ/repo.git', 'https://bb.example.com/bitbucket'],
    ['https://bb.example.com/projects/PROJ/repos/repo/browse', 'https://bb.example.com'],
  ])('Bitbucket Server %s', (url, origin) => {
    expect(pick(url)).toEqual({ type: 'BitbucketServer', origin, path: 'PROJ/repo', owner: 'PROJ', name: 'repo' });
  });

  it('keeps an HTTP(S) port on the web origin but drops an SSH port', () => {
    expect(parse('https://gitea.com:8443/owner/repo.git')?.origin).toBe('https://gitea.com:8443');
    expect(parse('http://gitea.com/owner/repo.git')?.origin).toBe('http://gitea.com');
    expect(parse('ssh://git@gitlab.com:2222/group/repo.git')?.origin).toBe('https://gitlab.com');
  });

  it.each([
    '',
    '   ',
    'not a url',
    'C:\\repo',
    'https://github.com',
    'https://github.com/owner',
    'ftp://github.com/o/r',
  ])('returns undefined for %j', (url) => {
    expect(parse(url)).toBeUndefined();
  });

  it('does not guess the provider of an unknown host', () => {
    expect(parse('https://git.example.com/group/repo.git')).toBeUndefined();
  });
});

describe('credentials', () => {
  it.each([
    ['https://oauth2:secret@github.com/owner/repo.git', 'https://github.com/owner/repo.git'],
    ['https://token@github.com/owner/repo.git', 'https://github.com/owner/repo.git'],
    ['git+https://user:secret@gitlab.com/group/repo.git', 'git+https://gitlab.com/group/repo.git'],
    ['ssh://git:secret@gitlab.com/group/repo.git', 'ssh://git@gitlab.com/group/repo.git'],
    ['git@github.com:owner/repo.git', 'git@github.com:owner/repo.git'],
  ])('sanitizes %s', (url, expected) => {
    expect(sanitizeGitUrl(url)).toBe(expected);
  });

  it('never exposes credentials in a parsed remote', () => {
    const remote = parse('https://oauth2:secret@gitlab.com/group/repo.git');
    expect(JSON.stringify(remote)).not.toContain('secret');
    expect(JSON.stringify(remote)).not.toContain('oauth2');
  });
});
