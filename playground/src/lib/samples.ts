export const defaultConfig = `[
  { "domain": "git.example.com", "type": "GitLab" },
  {
    "domain": "code.example.org",
    "type": "Custom",
    "name": "Example",
    "urls": {
      "repository": "https://code.example.org/\${repo}",
      "branches": "https://code.example.org/\${repo}/branches",
      "branch": "https://code.example.org/\${repo}/commits/\${branch}",
      "commit": "https://code.example.org/\${repo}/commit/\${id}"
    }
  }
]
`;

export interface Sample {
  label: string;
  url: string;
  /** Relies on the remote config examples. */
  config?: boolean;
}

// Addresses as they are copied from each provider: mainstream providers first, regional ones next,
// special notations after, and the remote config examples last.
export const samples: Sample[] = [
  { label: 'GitHub · repository', url: 'https://github.com/vuejs/core' },
  { label: 'GitHub · file', url: 'https://github.com/vuejs/core/blob/main/packages/vue/src/dev.ts' },
  { label: 'GitHub · SSH clone', url: 'git@github.com:vuejs/core.git' },
  { label: 'GitLab · compare', url: 'https://gitlab.com/inkscape/inkscape/-/compare/1.4.x...master' },
  {
    label: 'GitLab · blame',
    url: 'https://gitlab.com/inkscape/inkscape/-/blob/master/src/util/action-accel.cpp?blame=1',
  },
  { label: 'Gitea · branch', url: 'https://gitea.com/gitea/gitea-mcp/src/branch/main' },
  {
    label: 'Bitbucket · commit',
    url: 'https://bitbucket.org/ultrazohm/ultrazohm_sw/commits/78cdcf449f3725b03314175f01db2e7d5b9052d4',
  },
  { label: 'Azure DevOps · SSH clone', url: 'git@ssh.dev.azure.com:v3/org/project/repo' },
  { label: 'Bitbucket Server · HTTPS clone', url: 'https://bitbucket.example.com/scm/PROJ/repo.git' },
  { label: 'Gitee · tag', url: 'https://gitee.com/JD-opensource/jdchain/tree/1.6.5' },
  { label: 'CNB · compare', url: 'https://cnb.cool/cnb/skills/cnb-skill/-/compare/1.16.16..1.16.18' },
  {
    label: 'Codeup · file',
    url: 'https://codeup.aliyun.com/5f0000000000000000000000/group/sub/repo/blob/main/src/index.json',
  },
  { label: 'HTTPS clone with a token', url: 'https://oauth2:token@gitlab.com/group/sub/repo.git' },
  { label: 'Config · git.example.com (GitLab)', url: 'git@git.example.com:group/sub/repo.git', config: true },
  { label: 'Config · code.example.org (Custom)', url: 'https://code.example.org/team/app/commit/abc123', config: true },
];
