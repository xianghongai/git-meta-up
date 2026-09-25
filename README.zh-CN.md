# ![](playground/public/icon.svg) git-meta-up

[English](README.md) | 简体中文

从 Git 远程地址识别托管平台，并生成网页链接与 Clone 地址：仓库、组织、分支、Tag、提交、对比，以及文件、RAW、Blame 与文件历史。

- 不依赖任何 Git 地址解析库：地址解析自行实现，URL 使用 WHATWG URL API，路径使用 [path-to-regexp](https://github.com/pillarjs/path-to-regexp)。只提供 ES 模块，Node.js 与浏览器都能使用。
- 识别 HTTPS（带或不带凭据）、`ssh://`、`git://`、scp 写法 `git@host:path`，以及从浏览器复制的任意仓库页面地址，并识别出是哪类页面。
- 多级分组的仓库保留完整路径。
- 自托管域名用与 GitLens `gitlens.remotes` 相同的格式注册。

## 支持的平台

| 类型              | 内置识别                                        |
| ----------------- | ----------------------------------------------- |
| `GitHub`          | `github.com`                                    |
| `GitLab`          | `gitlab.com`                                    |
| `Gitea`           | `gitea.com`、`codeberg.org`                     |
| `Bitbucket`       | `bitbucket.org`                                 |
| `BitbucketServer` | 按 `/scm/…` 或 `/projects/…/repos/…` 路径识别   |
| `AzureDevOps`     | `dev.azure.com`、`*.visualstudio.com`、`/_git/` |
| `Gitee`           | `gitee.com`                                     |
| `CNB`             | `cnb.cool`                                      |
| `Codeup`          | `codeup.aliyun.com`                             |
| `Custom`          | 自定义链接模板                                  |

其它域名在注册之前返回 `undefined`，不猜测平台。

## 安装

```sh
npm install git-meta-up
```

## 使用

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

### 链接

| 链接                                 | 参数           | 页面                             |
| ------------------------------------ | -------------- | -------------------------------- |
| `repository`                         | —              | 仓库主页                         |
| `owner`                              | —              | 用户、组织或分组                 |
| `cloneHttps` / `cloneSsh`            | —              | Clone 地址                       |
| `branches` / `tags`                  | —              | 分支列表、Tag 列表               |
| `branch(name)` / `tag(name)`         | 引用名         | 某个分支、某个 Tag               |
| `commits(ref)`                       | 引用           | 分支、Tag 或提交的提交历史       |
| `commit(id)`                         | 提交 SHA       | 某次提交                         |
| `compare(base, head)`                | 两个引用       | 两个引用之间的差异               |
| `file` / `raw` / `blame` / `history` | 引用、文件路径 | 文件、原始内容、Blame 与文件历史 |

平台不提供的页面对应的链接不存在，调用前需要判断，例如 `links.compare?.(…)`：

- CNB 只支持 HTTPS Clone，没有 `cloneSsh`；Codeup 没有 `blame`。
- Azure DevOps 与 Bitbucket Server 没有 `compare`：它们的对比页需要知道引用是分支、Tag 还是提交。同样的原因，Gitea、Azure DevOps 与 Bitbucket Server 的路由带有引用类型，它们的 `commits` 与文件类链接把引用按分支处理。
- 输入本身是 SSH 地址时，`cloneSsh` 直接沿用输入，保留自定义的 SSH 主机与端口；否则按 `git@host:path.git` 生成。Azure DevOps 与 Bitbucket Server 只在输入为 SSH 地址时提供。

### 页面地址

粘贴任意仓库页面，`remote.page` 给出页面类型，以及从地址中读出的引用与文件路径：

```ts
parse('https://github.com/vuejs/core/blob/main/packages/vue/src/dev.ts')?.page;
// { kind: 'file', ref: 'main', file: 'packages/vue/src/dev.ts' }

parse('https://gitlab.com/group/repo/-/compare/v1.0.0...main')?.page;
// { kind: 'compare', base: 'v1.0.0', head: 'main' }
```

`kind` 取值同上表的链接类型；`repository` 也包括 HTTPS Clone 地址。模板没有描述的页面（Issue、合并请求等）仍能识别出仓库，只是没有 `page`。识别直接反向使用链接模板，与生成链接遵循同一套路由：

- 对比页同时接受 `...` 与 `..`。
- Gitee 与 Codeup 的分支和 Tag 共用同一种地址：名称像版本号（`v1.2.0`、`1.6.5`）的判为 Tag，其余判为分支。
- `Custom` 平台没有路由标记，仓库路径取“剩余部分能匹配某个模板”的最短路径。

### 自托管域名

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

- `domain` 匹配该域名及其子域名；写成 `host:port` 时只匹配该端口。
- 注册的配置优先于内置识别，后注册的优先于先注册的。
- `protocol` 指定网页使用的协议；未指定时沿用远程地址本身的 HTTP(S) 协议，其它情况用 `https`。
- 注册只影响所在的实例，顶层的 `parse()` 只使用内置识别。
- `type` 不在支持范围内或 `domain` 为空时，注册即抛出错误。

### 链接模板

`Custom` 类型可以为上表中的每种链接提供模板，键名相同。占位符如下：

| 占位符                            | 取值                                          |
| --------------------------------- | --------------------------------------------- |
| `${origin}`                       | 网页 origin，如 `https://git.example.com`     |
| `${host}`                         | 主机名，如 `git.example.com`                  |
| `${repo}`                         | 仓库路径，如 `group/sub/repo`                 |
| `${owner}` / `${name}`            | 去掉最后一段的路径 / 最后一段                 |
| `${org}`                          | 路径的第一段                                  |
| `${branch}` / `${tag}` / `${ref}` | 引用名；在路径中保留 `/`，其余字符按 URL 编码 |
| `${id}`                           | 提交 SHA                                      |
| `${base}` / `${head}`             | 对比的两个引用                                |
| `${file}`                         | 仓库内的文件路径，开头的 `./` 或 `/` 会被去掉 |

出现在查询参数中的引用名与文件路径整体编码，`/` 也会编码。

### 凭据

解析结果中不包含凭据：`remote.url` 是去掉用户信息后的输入地址。其它地址可以用 `sanitizeGitUrl()` 做同样处理。

```ts
import { sanitizeGitUrl } from 'git-meta-up';

sanitizeGitUrl('https://oauth2:token@gitlab.com/group/repo.git');
// https://gitlab.com/group/repo.git
```

## API

| 导出                       | 说明                                              |
| -------------------------- | ------------------------------------------------- |
| `parse(url)`               | 只用内置识别解析；无法识别时返回 `undefined`      |
| `urls(remote)`             | 生成解析结果的网页链接                            |
| `createGitMetaUp(options)` | 创建带 `register()`、`parse()`、`urls()` 的解析器 |
| `sanitizeGitUrl(url)`      | 去掉地址中的凭据                                  |
| `gitProviderTypes`         | 全部平台类型                                      |

解析得到的 `GitRemote` 是纯 JSON 数据（`provider`、`transport`、`host`、`origin`、`path`、`owner`、`name`、`url`、`templates`），可以存储或跨进程传递，之后再交给 `urls()` 生成链接。

## 演示页

演示页可以编辑自托管配置、解析地址，并在浏览器中保存解析历史：

```sh
pnpm install
pnpm playground:dev
```

`.github/workflows/pages.yml` 负责部署到 GitHub Pages。

## License

[MIT](LICENSE)
