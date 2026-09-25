import { describe, expect, it } from 'vitest';
import { createGitMetaUp, parse, urls, type GitRemote } from '../src/index.js';

const remote = (url: string): GitRemote => {
  const parsed = parse(url);
  if (!parsed) {
    throw new Error(`cannot parse ${url}`);
  }
  return parsed;
};

const links = (url: string) => {
  const result = urls(remote(url));
  return {
    repository: result.repository,
    owner: result.owner,
    cloneHttps: result.cloneHttps,
    cloneSsh: result.cloneSsh,
    branches: result.branches,
    branch: result.branch?.('main'),
    commits: result.commits?.('main'),
    tags: result.tags,
    tag: result.tag?.('v1.0.0'),
    commit: result.commit?.('abc123'),
    compare: result.compare?.('v1.0.0', 'abc123'),
    file: result.file?.('main', 'src/a.ts'),
    raw: result.raw?.('main', 'src/a.ts'),
    blame: result.blame?.('main', 'src/a.ts'),
    history: result.history?.('main', 'src/a.ts'),
  };
};

describe('links', () => {
  it.each([
    [
      'git@github.com:o/r.git',
      {
        repository: 'https://github.com/o/r',
        owner: 'https://github.com/o',
        cloneHttps: 'https://github.com/o/r.git',
        cloneSsh: 'git@github.com:o/r.git',
        branches: 'https://github.com/o/r/branches',
        branch: 'https://github.com/o/r/tree/main',
        commits: 'https://github.com/o/r/commits/main',
        tags: 'https://github.com/o/r/tags',
        tag: 'https://github.com/o/r/releases/tag/v1.0.0',
        commit: 'https://github.com/o/r/commit/abc123',
        compare: 'https://github.com/o/r/compare/v1.0.0...abc123',
        file: 'https://github.com/o/r/blob/main/src/a.ts',
        raw: 'https://github.com/o/r/raw/main/src/a.ts',
        blame: 'https://github.com/o/r/blame/main/src/a.ts',
        history: 'https://github.com/o/r/commits/main/src/a.ts',
      },
    ],
    [
      'https://gitlab.com/g/s/r.git',
      {
        repository: 'https://gitlab.com/g/s/r',
        owner: 'https://gitlab.com/g/s',
        cloneHttps: 'https://gitlab.com/g/s/r.git',
        cloneSsh: 'git@gitlab.com:g/s/r.git',
        branches: 'https://gitlab.com/g/s/r/-/branches',
        branch: 'https://gitlab.com/g/s/r/-/tree/main',
        commits: 'https://gitlab.com/g/s/r/-/commits/main',
        tags: 'https://gitlab.com/g/s/r/-/tags',
        tag: 'https://gitlab.com/g/s/r/-/tags/v1.0.0',
        commit: 'https://gitlab.com/g/s/r/-/commit/abc123',
        compare: 'https://gitlab.com/g/s/r/-/compare/v1.0.0...abc123',
        file: 'https://gitlab.com/g/s/r/-/blob/main/src/a.ts',
        raw: 'https://gitlab.com/g/s/r/-/raw/main/src/a.ts',
        blame: 'https://gitlab.com/g/s/r/-/blob/main/src/a.ts?blame=1',
        history: 'https://gitlab.com/g/s/r/-/commits/main/src/a.ts',
      },
    ],
    [
      'https://gitea.com/o/r.git',
      {
        repository: 'https://gitea.com/o/r',
        owner: 'https://gitea.com/o',
        cloneHttps: 'https://gitea.com/o/r.git',
        cloneSsh: 'git@gitea.com:o/r.git',
        branches: 'https://gitea.com/o/r/branches',
        branch: 'https://gitea.com/o/r/src/branch/main',
        commits: 'https://gitea.com/o/r/commits/branch/main',
        tags: 'https://gitea.com/o/r/tags',
        tag: 'https://gitea.com/o/r/releases/tag/v1.0.0',
        commit: 'https://gitea.com/o/r/commit/abc123',
        compare: 'https://gitea.com/o/r/compare/v1.0.0...abc123',
        file: 'https://gitea.com/o/r/src/branch/main/src/a.ts',
        raw: 'https://gitea.com/o/r/raw/branch/main/src/a.ts',
        blame: 'https://gitea.com/o/r/blame/branch/main/src/a.ts',
        history: 'https://gitea.com/o/r/commits/branch/main/src/a.ts',
      },
    ],
    [
      'https://bitbucket.org/t/r.git',
      {
        repository: 'https://bitbucket.org/t/r',
        owner: 'https://bitbucket.org/t/',
        cloneHttps: 'https://bitbucket.org/t/r.git',
        cloneSsh: 'git@bitbucket.org:t/r.git',
        branches: 'https://bitbucket.org/t/r/branches/',
        branch: 'https://bitbucket.org/t/r/branch/main',
        commits: 'https://bitbucket.org/t/r/commits/branch/main',
        tags: 'https://bitbucket.org/t/r/downloads/?tab=tags',
        tag: 'https://bitbucket.org/t/r/commits/tag/v1.0.0',
        commit: 'https://bitbucket.org/t/r/commits/abc123',
        compare: 'https://bitbucket.org/t/r/branches/compare/abc123%0Dv1.0.0',
        file: 'https://bitbucket.org/t/r/src/main/src/a.ts',
        raw: 'https://bitbucket.org/t/r/raw/main/src/a.ts',
        blame: 'https://bitbucket.org/t/r/annotate/main/src/a.ts',
        history: 'https://bitbucket.org/t/r/history-node/main/src/a.ts',
      },
    ],
    [
      'https://bb.example.com/scm/PROJ/r.git',
      {
        repository: 'https://bb.example.com/projects/PROJ/repos/r/browse',
        owner: 'https://bb.example.com/projects/PROJ',
        cloneHttps: 'https://bb.example.com/scm/PROJ/r.git',
        cloneSsh: undefined,
        branches: 'https://bb.example.com/projects/PROJ/repos/r/branches',
        branch: 'https://bb.example.com/projects/PROJ/repos/r/browse?at=refs%2Fheads%2Fmain',
        commits: 'https://bb.example.com/projects/PROJ/repos/r/commits?until=main',
        tags: 'https://bb.example.com/projects/PROJ/repos/r/tags',
        tag: 'https://bb.example.com/projects/PROJ/repos/r/browse?at=refs%2Ftags%2Fv1.0.0',
        commit: 'https://bb.example.com/projects/PROJ/repos/r/commits/abc123',
        compare: undefined,
        file: 'https://bb.example.com/projects/PROJ/repos/r/browse/src/a.ts?at=main',
        raw: 'https://bb.example.com/projects/PROJ/repos/r/raw/src/a.ts?at=main',
        blame: undefined,
        history: undefined,
      },
    ],
    [
      'https://dev.azure.com/org/p/_git/r',
      {
        repository: 'https://dev.azure.com/org/p/_git/r',
        owner: 'https://dev.azure.com/org/p',
        cloneHttps: 'https://dev.azure.com/org/p/_git/r',
        cloneSsh: undefined,
        branches: 'https://dev.azure.com/org/p/_git/r/branches',
        branch: 'https://dev.azure.com/org/p/_git/r?version=GBmain',
        commits: 'https://dev.azure.com/org/p/_git/r/commits?itemVersion=GBmain',
        tags: 'https://dev.azure.com/org/p/_git/r/tags',
        tag: 'https://dev.azure.com/org/p/_git/r?version=GTv1.0.0',
        commit: 'https://dev.azure.com/org/p/_git/r/commit/abc123',
        compare: undefined,
        file: 'https://dev.azure.com/org/p/_git/r?path=%2Fsrc%2Fa.ts&version=GBmain',
        raw: undefined,
        blame: undefined,
        history: 'https://dev.azure.com/org/p/_git/r?path=%2Fsrc%2Fa.ts&version=GBmain&_a=history',
      },
    ],
    [
      'git@gitee.com:o/r.git',
      {
        repository: 'https://gitee.com/o/r',
        owner: 'https://gitee.com/o',
        cloneHttps: 'https://gitee.com/o/r.git',
        cloneSsh: 'git@gitee.com:o/r.git',
        branches: 'https://gitee.com/o/r/branches',
        branch: 'https://gitee.com/o/r/tree/main',
        commits: 'https://gitee.com/o/r/commits/main',
        tags: 'https://gitee.com/o/r/tags',
        tag: 'https://gitee.com/o/r/tree/v1.0.0',
        commit: 'https://gitee.com/o/r/commit/abc123',
        compare: 'https://gitee.com/o/r/compare/v1.0.0...abc123',
        file: 'https://gitee.com/o/r/blob/main/src/a.ts',
        raw: 'https://gitee.com/o/r/raw/main/src/a.ts',
        blame: 'https://gitee.com/o/r/blame/main/src/a.ts',
        history: 'https://gitee.com/o/r/commits/main/src/a.ts',
      },
    ],
    [
      'https://cnb.cool/o/g/r',
      {
        repository: 'https://cnb.cool/o/g/r',
        owner: 'https://cnb.cool/o/g',
        cloneHttps: 'https://cnb.cool/o/g/r',
        cloneSsh: undefined,
        branches: 'https://cnb.cool/o/g/r/-/branches',
        branch: 'https://cnb.cool/o/g/r/-/tree/main',
        commits: 'https://cnb.cool/o/g/r/-/commits/main',
        tags: 'https://cnb.cool/o/g/r/-/tags',
        tag: 'https://cnb.cool/o/g/r/-/releases/tag/v1.0.0',
        commit: 'https://cnb.cool/o/g/r/-/commit/abc123',
        compare: 'https://cnb.cool/o/g/r/-/compare/v1.0.0...abc123',
        file: 'https://cnb.cool/o/g/r/-/blob/main/src/a.ts',
        raw: 'https://cnb.cool/o/g/r/-/git/raw/main/src/a.ts',
        blame: 'https://cnb.cool/o/g/r/-/blame/main/src/a.ts',
        history: 'https://cnb.cool/o/g/r/-/commits/main/src/a.ts',
      },
    ],
    [
      'https://codeup.aliyun.com/5f40/g/r.git',
      {
        repository: 'https://codeup.aliyun.com/5f40/g/r',
        owner: 'https://codeup.aliyun.com/5f40',
        cloneHttps: 'https://codeup.aliyun.com/5f40/g/r.git',
        cloneSsh: 'git@codeup.aliyun.com:5f40/g/r.git',
        branches: 'https://codeup.aliyun.com/5f40/g/r/branches',
        branch: 'https://codeup.aliyun.com/5f40/g/r/tree/main',
        commits: 'https://codeup.aliyun.com/5f40/g/r/commits/main',
        tags: 'https://codeup.aliyun.com/5f40/g/r/tags',
        tag: 'https://codeup.aliyun.com/5f40/g/r/tree/v1.0.0',
        commit: 'https://codeup.aliyun.com/5f40/g/r/commit/abc123',
        compare: 'https://codeup.aliyun.com/5f40/g/r/compare?from=v1.0.0&to=abc123',
        file: 'https://codeup.aliyun.com/5f40/g/r/blob/main/src/a.ts',
        raw: 'https://codeup.aliyun.com/5f40/g/r/raw/main/src/a.ts',
        blame: undefined,
        history: 'https://codeup.aliyun.com/5f40/g/r/commits/main/src/a.ts',
      },
    ],
  ])('%s', (url, expected) => {
    expect(links(url)).toEqual(expected);
  });

  it('keeps slashes in branch paths and encodes reserved characters', () => {
    const github = urls(remote('https://github.com/o/r'));
    expect(github.branch?.('feature/1.1.0')).toBe('https://github.com/o/r/tree/feature/1.1.0');
    expect(github.tag?.('1.0.0-alpha.17+CHKPF')).toBe('https://github.com/o/r/releases/tag/1.0.0-alpha.17%2BCHKPF');
    expect(github.branch?.('fix #1')).toBe('https://github.com/o/r/tree/fix%20%231');
    // Inside the query string the whole value is encoded, `/` included.
    const azure = urls(remote('https://dev.azure.com/org/p/_git/r'));
    expect(azure.branch?.('feature/1.1.0')).toBe('https://dev.azure.com/org/p/_git/r?version=GBfeature%2F1.1.0');
  });
  it('takes the SSH clone URL from an SSH input, keeping its host and port', () => {
    const meta = createGitMetaUp({ remotes: [{ domain: 'git.example.com', type: 'GitLab' }] });
    const parsed = meta.parse('ssh://git@git.example.com:2222/group/repo.git')!;
    expect(meta.urls(parsed).cloneSsh).toBe('ssh://git@git.example.com:2222/group/repo.git');
    expect(meta.urls(parsed).cloneHttps).toBe('https://git.example.com/group/repo.git');
  });

  it('normalizes file paths and encodes them per segment', () => {
    const github = urls(remote('https://github.com/o/r'));
    expect(github.file?.('feature/x', './docs/read me.md')).toBe(
      'https://github.com/o/r/blob/feature/x/docs/read%20me.md'
    );
    expect(github.raw?.('main', '/a.ts')).toBe('https://github.com/o/r/raw/main/a.ts');
  });
});

describe('register', () => {
  it('resolves a registered self-hosted domain and its subdomains', () => {
    const meta = createGitMetaUp({ remotes: [{ domain: 'example.com', type: 'GitLab' }] });
    expect(meta.parse('git@git.example.com:group/sub/repo.git')).toMatchObject({
      provider: { type: 'GitLab', name: 'GitLab' },
      origin: 'https://git.example.com',
      path: 'group/sub/repo',
    });
  });

  it('accepts a domain written as a URL or with a port', () => {
    const meta = createGitMetaUp()
      .register({ domain: 'https://git.example.com/', type: 'Gitea', protocol: 'http' })
      .register({ domain: 'code.example.com:8443', type: 'GitLab' });
    expect(meta.parse('git@git.example.com:o/r.git')?.origin).toBe('http://git.example.com');
    expect(meta.parse('https://code.example.com:8443/g/r.git')?.provider.type).toBe('GitLab');
    expect(meta.parse('https://code.example.com/g/r.git')).toBeUndefined();
  });

  it('lets registrations override built-in hosts, the latest one first', () => {
    const meta = createGitMetaUp({ remotes: [{ domain: 'cnb.cool', type: 'GitLab' }] });
    expect(meta.parse('https://cnb.cool/o/r')?.provider.type).toBe('GitLab');
    meta.register({ domain: 'cnb.cool', type: 'CNB', name: 'Cloud Native Build' });
    expect(meta.parse('https://cnb.cool/o/r')?.provider).toEqual({ type: 'CNB', name: 'Cloud Native Build' });
  });

  it('builds Custom links from GitLens-style templates and omits missing kinds', () => {
    const meta = createGitMetaUp({
      remotes: [
        {
          domain: 'git.example.com',
          type: 'Custom',
          name: 'Example',
          urls: {
            repository: 'https://web.example.com/${repo}',
            branch: 'https://web.example.com/${repo}/commits/${branch}',
            commit: 'https://web.example.com/${repo}/commit/${id}',
          },
        },
      ],
    });
    const parsed = meta.parse('git@git.example.com:a/b/c.git')!;
    const result = meta.urls(parsed);
    expect(parsed.provider).toEqual({ type: 'Custom', name: 'Example' });
    expect(result.repository).toBe('https://web.example.com/a/b/c');
    expect(result.branch?.('dev/x')).toBe('https://web.example.com/a/b/c/commits/dev/x');
    expect(result.commit?.('abc')).toBe('https://web.example.com/a/b/c/commit/abc');
    expect(result.tag).toBeUndefined();
    expect(result.compare).toBeUndefined();
  });

  it('finds where a Custom repository path ends from its page templates', () => {
    const meta = createGitMetaUp({
      remotes: [
        {
          domain: 'code.example.org',
          type: 'Custom',
          urls: { commit: 'https://code.example.org/${repo}/commit/${id}' },
        },
      ],
    });
    expect(meta.parse('https://code.example.org/team/app/commit/abc123')).toMatchObject({
      path: 'team/app',
      page: { kind: 'commit', id: 'abc123' },
    });
    expect(meta.parse('https://code.example.org/team/sub/app.git')).toMatchObject({ path: 'team/sub/app' });
  });

  it('keeps instances independent of each other and of the built-in parse', () => {
    const meta = createGitMetaUp({ remotes: [{ domain: 'git.example.com', type: 'GitLab' }] });
    expect(meta.parse('https://git.example.com/g/r')).toBeDefined();
    expect(createGitMetaUp().parse('https://git.example.com/g/r')).toBeUndefined();
    expect(parse('https://git.example.com/g/r')).toBeUndefined();
  });

  it('rejects invalid configs when they are registered', () => {
    expect(() => createGitMetaUp({ remotes: [{ domain: ' ', type: 'GitLab' }] })).toThrow(/domain/);
    expect(() => createGitMetaUp().register({ domain: 'x.com', type: 'Gogs' as 'GitLab' })).toThrow(/Gogs/);
  });
});
