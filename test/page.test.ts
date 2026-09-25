import { describe, expect, it } from 'vitest';
import { parse } from '../src/index.js';

const page = (url: string) => parse(url)?.page;

describe('page', () => {
  it.each([
    // GitHub
    ['https://github.com/vuejs/core', { kind: 'repository' }],
    ['https://github.com/vuejs/core.git', { kind: 'repository' }],
    ['https://github.com/vuejs/core/branches', { kind: 'branches' }],
    ['https://github.com/vuejs/core/tree/main', { kind: 'branch', branch: 'main' }],
    ['https://github.com/vuejs/core/tree/feature/x', { kind: 'branch', branch: 'feature/x' }],
    ['https://github.com/vuejs/core/commits/main/', { kind: 'commits', ref: 'main' }],
    ['https://github.com/vuejs/core/commit/4ab865a', { kind: 'commit', id: '4ab865a' }],
    ['https://github.com/vuejs/core/tags', { kind: 'tags' }],
    ['https://github.com/vuejs/core/releases/tag/v3.6.0-rc.9', { kind: 'tag', tag: 'v3.6.0-rc.9' }],
    [
      'https://github.com/vuejs/core/compare/v3.6.0-rc.9...main',
      { kind: 'compare', base: 'v3.6.0-rc.9', head: 'main' },
    ],
    [
      'https://github.com/vuejs/core/blob/897924c/packages/vue/src/dev.ts',
      { kind: 'file', ref: '897924c', file: 'packages/vue/src/dev.ts' },
    ],
    [
      'https://github.com/vuejs/core/raw/897924c/packages/vue/src/dev.ts',
      { kind: 'raw', ref: '897924c', file: 'packages/vue/src/dev.ts' },
    ],
    [
      'https://github.com/vuejs/core/blame/897924c/packages/vue/src/dev.ts',
      { kind: 'blame', ref: '897924c', file: 'packages/vue/src/dev.ts' },
    ],
    [
      'https://github.com/vuejs/core/commits/897924c/packages/vue/src/dev.ts',
      { kind: 'history', ref: '897924c', file: 'packages/vue/src/dev.ts' },
    ],
    // GitLab: the new blame URL is the file page with `?blame=1`
    ['https://gitlab.com/inkscape/inkscape/-/tree/master', { kind: 'branch', branch: 'master' }],
    ['https://gitlab.com/inkscape/inkscape/-/tags/INKSCAPE_1_4_4', { kind: 'tag', tag: 'INKSCAPE_1_4_4' }],
    [
      'https://gitlab.com/inkscape/inkscape/-/compare/1.4.x...master',
      { kind: 'compare', base: '1.4.x', head: 'master' },
    ],
    [
      'https://gitlab.com/inkscape/inkscape/-/blob/master/src/a.cpp?blame=1',
      { kind: 'blame', ref: 'master', file: 'src/a.cpp' },
    ],
    [
      'https://gitlab.com/inkscape/inkscape/-/blob/master/src/a.cpp',
      { kind: 'file', ref: 'master', file: 'src/a.cpp' },
    ],
    // Gitea: typed branch routes
    ['https://gitea.com/gitea/gitea-mcp/src/branch/main', { kind: 'branch', branch: 'main' }],
    ['https://gitea.com/gitea/gitea-mcp/commits/branch/main', { kind: 'commits', ref: 'main' }],
    [
      'https://gitea.com/gitea/gitea-mcp/src/branch/main/.gitea/ci.yml',
      { kind: 'file', ref: 'main', file: '.gitea/ci.yml' },
    ],
    [
      'https://gitea.com/gitea/gitea-mcp/raw/branch/main/.gitea/ci.yml',
      { kind: 'raw', ref: 'main', file: '.gitea/ci.yml' },
    ],
    ['https://gitea.com/gitea/gitea-mcp/releases/tag/v1.7.0', { kind: 'tag', tag: 'v1.7.0' }],
    // Bitbucket: `%0D` separates the refs of a comparison
    ['https://bitbucket.org/ultrazohm/ultrazohm_sw/branch/develop', { kind: 'branch', branch: 'develop' }],
    ['https://bitbucket.org/ultrazohm/ultrazohm_sw/commits/branch/develop', { kind: 'commits', ref: 'develop' }],
    [
      'https://bitbucket.org/ultrazohm/ultrazohm_sw/branches/compare/main%0Ddevelop',
      { kind: 'compare', head: 'main', base: 'develop' },
    ],
    [
      'https://bitbucket.org/ultrazohm/ultrazohm_sw/annotate/develop/app.py',
      { kind: 'blame', ref: 'develop', file: 'app.py' },
    ],
    [
      'https://bitbucket.org/ultrazohm/ultrazohm_sw/history-node/78cdcf4/app.py?at=feature/x',
      { kind: 'history', ref: '78cdcf4', file: 'app.py' },
    ],
    // Gitee and Codeup share one URL for branches and tags
    ['https://gitee.com/JD-opensource/jdchain/tree/1.6.5', { kind: 'tag', tag: '1.6.5' }],
    ['https://gitee.com/JD-opensource/jdchain/tree/develop', { kind: 'branch', branch: 'develop' }],
    [
      'https://gitee.com/JD-opensource/jdchain/compare/develop...master',
      { kind: 'compare', base: 'develop', head: 'master' },
    ],
    ['https://codeup.aliyun.com/5f40/group/repo/tree/main', { kind: 'branch', branch: 'main' }],
    ['https://codeup.aliyun.com/5f40/group/repo/tree/v18.0.1', { kind: 'tag', tag: 'v18.0.1' }],
    ['https://codeup.aliyun.com/5f40/group/repo/commit/737c394?branch=main', { kind: 'commit', id: '737c394' }],
    ['https://codeup.aliyun.com/5f40/group/repo/raw/main/src/a.json', { kind: 'raw', ref: 'main', file: 'src/a.json' }],
    [
      'https://codeup.aliyun.com/5f40/group/repo/compare?from=main&to=v18.0.1',
      { kind: 'compare', base: 'main', head: 'v18.0.1' },
    ],
    // CNB: two-dot comparisons too
    [
      'https://cnb.cool/cnb/skills/cnb-skill/-/compare/1.16.16..1.16.18',
      { kind: 'compare', base: '1.16.16', head: '1.16.18' },
    ],
    ['https://cnb.cool/cnb/skills/cnb-skill/-/releases/tag/1.16.18', { kind: 'tag', tag: '1.16.18' }],
    [
      'https://cnb.cool/cnb/skills/cnb-skill/-/git/raw/main/skills/SKILL.md',
      { kind: 'raw', ref: 'main', file: 'skills/SKILL.md' },
    ],
    // Refs in the query string
    ['https://dev.azure.com/org/p/_git/r?version=GBfeature%2Fx', { kind: 'branch', branch: 'feature/x' }],
    [
      'https://bb.example.com/bitbucket/projects/PROJ/repos/r/browse?at=refs%2Fheads%2Fmain',
      { kind: 'branch', branch: 'main' },
    ],
    ['https://bb.example.com/bitbucket/scm/PROJ/r.git', { kind: 'repository' }],
  ])('%s', (url, expected) => {
    expect(page(url)).toEqual(expected);
  });

  it('keeps the repository of a page the templates do not cover', () => {
    const remote = parse('https://github.com/vuejs/core/issues/1');
    expect(remote?.path).toBe('vuejs/core');
    expect(remote?.page).toBeUndefined();
  });

  it('has no page for SSH remotes', () => {
    expect(parse('git@github.com:vuejs/core.git')?.page).toBeUndefined();
  });
});
