# ![](playground/public/icon.svg) git-meta-up

English | [简体中文](README.zh-CN.md)

Resolve a Git remote URL to its hosting provider and build web links and clone URLs: repository, owner, branches, tags, commits, comparisons, and a file's page, raw content, blame and history.

- No Git URL parsing dependencies: remotes are parsed here, with the WHATWG URL API and [path-to-regexp](https://github.com/pillarjs/path-to-regexp) for paths. ES modules only; runs in Node.js and in the browser.
- Understands HTTPS (with or without credentials), `ssh://`, `git://`, scp-style `git@host:path`, and any repository page copied from the browser, telling which page it is.
- Keeps every group level of nested repositories.
- Self-hosted domains are registered with the same shape as GitLens `gitlens.remotes`.

## Supported providers

| Type              | Built-in hosts                                  |
| ----------------- | ----------------------------------------------- |
| `GitHub`          | `github.com`                                    |
| `GitLab`          | `gitlab.com`                                    |
| `Gitea`           | `gitea.com`, `codeberg.org`                     |
| `Bitbucket`       | `bitbucket.org`                                 |
| `BitbucketServer` | recognized by `/scm/…` or `/projects/…/repos/…` |
| `AzureDevOps`     | `dev.azure.com`, `*.visualstudio.com`, `/_git/` |
| `Gitee`           | `gitee.com`                                     |
| `CNB`             | `cnb.cool`                                      |
| `Codeup`          | `codeup.aliyun.com`                             |
| `Custom`          | your own link templates                         |

Any other host returns `undefined` until you register it; the provider is never guessed.

## Install

```sh
npm install git-meta-up
```

## Usage

```ts
import { parse, urls } from 'git-meta-up';

const remote = parse('git@gitee.com:owner/repo.git');
// remote.provider → { type: 'Gitee', name: 'Gitee' }
// remote.origin   → 'https://gitee.com'
// remote.path     → 'owner/repo'

const links = urls(remote!);
links.repository; // https://gitee.com/owner/repo
links.branch?.('feature/1.1.0'); // https://gitee.com/owner/repo/tree/feature/1.1.0
links.tag?.('v1.0.0'); // https://gitee.com/owner/repo/tree/v1.0.0
links.commit?.('abc123'); // https://gitee.com/owner/repo/commit/abc123
links.compare?.('v1.0.0', 'main'); // https://gitee.com/owner/repo/compare/v1.0.0...main
links.cloneSsh; // git@gitee.com:owner/repo.git
links.file?.('main', 'src/index.ts'); // https://gitee.com/owner/repo/blob/main/src/index.ts
```

### Links

| Link                                 | Arguments      | Page                                       |
| ------------------------------------ | -------------- | ------------------------------------------ |
| `repository`                         | —              | Repository home                            |
| `owner`                              | —              | User, organization or group                |
| `cloneHttps` / `cloneSsh`            | —              | Clone URLs                                 |
| `branches` / `tags`                  | —              | Branch and tag lists                       |
| `branch(name)` / `tag(name)`         | ref name       | A branch or a tag                          |
| `commits(ref)`                       | ref            | Commit history of a branch, tag or commit  |
| `commit(id)`                         | commit SHA     | A commit                                   |
| `compare(base, head)`                | two refs       | Differences between two refs               |
| `file` / `raw` / `blame` / `history` | ref, file path | A file, its raw content, blame and history |

A link kind the provider does not offer is absent, so check it before calling, e.g. `links.compare?.(…)`:

- CNB clones over HTTPS only, so it has no `cloneSsh`; Codeup has no `blame`.
- Azure DevOps and Bitbucket Server have no `compare`, since their comparison pages need to know whether each ref is a branch, a tag or a commit. For the same reason, `commits` and file links on Gitea, Azure DevOps and Bitbucket Server take the ref as a branch, since their routes carry the ref type.
- `cloneSsh` repeats the input when it is an SSH URL, keeping custom SSH hosts and ports; otherwise it is built as `git@host:path.git`. Azure DevOps and Bitbucket Server only get it from an SSH input.

### Page URLs

Paste any repository page and `remote.page` tells which page it is, with the refs and file path read from it:

```ts
parse('https://github.com/vuejs/core/blob/main/packages/vue/src/dev.ts')?.page;
// { kind: 'file', ref: 'main', file: 'packages/vue/src/dev.ts' }

parse('https://gitlab.com/group/repo/-/compare/v1.0.0...main')?.page;
// { kind: 'compare', base: 'v1.0.0', head: 'main' }
```

`kind` is one of the link kinds above; `repository` also covers the HTTPS clone URL. Pages the templates do not describe (issues, merge requests, …) still resolve the repository, without `page`. The templates are read in reverse, so recognition follows the same routes as the links:

- Comparisons accept both `...` and `..`.
- Gitee and Codeup use one URL for branches and tags; a version-like name (`v1.2.0`, `1.6.5`) is taken as a tag, anything else as a branch.
- A `Custom` remote has no route marker, so the repository path is the shortest one whose remainder matches one of its templates.

### Self-hosted domains

```ts
import { createGitMetaUp } from 'git-meta-up';

const gitMeta = createGitMetaUp({
  remotes: [{ domain: 'git.example.com', type: 'GitLab' }],
});

gitMeta.register({
  domain: 'code.example.org',
  type: 'Custom',
  name: 'Example',
  urls: {
    repository: 'https://code.example.org/${repo}',
    branch: 'https://code.example.org/${repo}/commits/${branch}',
    commit: 'https://code.example.org/${repo}/commit/${id}',
  },
});

const remote = gitMeta.parse('git@git.example.com:group/sub/repo.git');
gitMeta.urls(remote!).branch?.('main');
// https://git.example.com/group/sub/repo/-/tree/main
```

- `domain` matches the host and its subdomains; `host:port` matches only that port.
- Registered configs win over built-in hosts, and later registrations win over earlier ones.
- `protocol` sets the protocol of the web pages; it defaults to the remote's own HTTP(S) protocol, otherwise `https`.
- Registration only affects its own instance. The top-level `parse()` uses built-in hosts only.
- An unknown `type` or an empty `domain` throws when the config is registered.

### Link templates

`Custom` remotes take a template for each link kind above, keyed by the same names. Placeholders:

| Placeholder                       | Value                                                             |
| --------------------------------- | ----------------------------------------------------------------- |
| `${origin}`                       | Web origin, e.g. `https://git.example.com`                        |
| `${host}`                         | Host name, e.g. `git.example.com`                                 |
| `${repo}`                         | Repository path, e.g. `group/sub/repo`                            |
| `${owner}` / `${name}`            | Path without the last segment / the last segment                  |
| `${org}`                          | First path segment                                                |
| `${branch}` / `${tag}` / `${ref}` | Ref names; `/` is kept in paths, the rest is URL-encoded          |
| `${id}`                           | Commit SHA                                                        |
| `${base}` / `${head}`             | Comparison refs                                                   |
| `${file}`                         | File path inside the repository; a leading `./` or `/` is removed |

Inside a query string, refs and file paths are encoded as a whole, `/` included.

### Credentials

Credentials never appear in a parsed remote: `remote.url` is the input with its user info removed. Use `sanitizeGitUrl()` to do the same for any URL.

```ts
import { sanitizeGitUrl } from 'git-meta-up';

sanitizeGitUrl('https://oauth2:token@gitlab.com/group/repo.git');
// https://gitlab.com/group/repo.git
```

## API

| Export                     | Description                                                    |
| -------------------------- | -------------------------------------------------------------- |
| `parse(url)`               | Parse with built-in providers; `undefined` when not recognized |
| `urls(remote)`             | Web links of a parsed remote                                   |
| `createGitMetaUp(options)` | A resolver with `register()`, `parse()` and `urls()`           |
| `sanitizeGitUrl(url)`      | Remove credentials from a URL                                  |
| `gitProviderTypes`         | All provider types                                             |

A parsed `GitRemote` is plain JSON (`provider`, `transport`, `host`, `origin`, `path`, `owner`, `name`, `url`, `templates`), so it can be stored or sent across processes and passed to `urls()` later.

## Playground

The playground parses a URL with an editable remote config and keeps a history in your browser:

```sh
pnpm install
pnpm playground:dev
```

`.github/workflows/pages.yml` deploys it to GitHub Pages.

## License

[MIT](LICENSE)
