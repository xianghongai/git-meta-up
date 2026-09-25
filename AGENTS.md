# AGENTS.md

## 职责

- `git-meta-up` 从 Git 远程地址识别托管平台，并生成仓库、分支、Tag、提交、对比等网页链接。与 MFA 无关，任何项目都能使用。
- 不依赖 Git 地址解析类的包，Git 远程与平台识别自行实现；处理 URL 与路径用成熟的通用方案：WHATWG `URL` / `URLSearchParams`，以及 `path-to-regexp`（模板与页面路由的生成、匹配、按段编码）。只输出 ES 模块，Node.js 与浏览器都要能直接运行。`src/` 不使用 Node 或 DOM 专属 API，`tsconfig.build.json` 只引入 ECMAScript 标准库，`types/whatwg-url.d.ts` 只声明用到的 URL 成员。
- 解析结果 `GitRemote` 保持纯 JSON，可存储、可跨进程传递；链接由 `urls()` 按其中的 `templates` 生成。
- 自托管平台通过 `createGitMetaUp({ remotes })` / `register()` 注册，格式与 GitLens `gitlens.remotes` 一致；注册只影响所在实例，不修改全局状态。
- 无法识别的域名返回 `undefined`，不猜测平台。

## 结构

- `src/parse-url.ts`：各种地址写法统一为传输方式、主机、端口、路径段；`sanitizeGitUrl` 去除凭据。
- `src/providers.ts`：内置平台的识别规则、仓库路径规整（截掉页面路由、Azure DevOps 与 Bitbucket Server 的特殊结构）与链接模板。
- `src/route.ts`：把 GitLens 风格的 `${…}` 模板转为 path-to-regexp 路径与查询参数，供生成链接和识别页面共用。
- `src/page.ts`：反向使用链接模板识别页面地址属于哪类页面，并取出引用与文件路径；生成与识别共用同一张模板表，不另外维护识别规则。
- `src/urls.ts`：填充模板。仓库类取值原样填入；引用名在路径中按段编码、保留 `/`，在查询参数中整体编码。
- `src/resolver.ts`：注册、识别顺序（注册配置 → 内置域名 → 路径特征）与 origin 组装。
- `playground/`：pnpm workspace 中的演示页（`git-meta-up-playground`，private，不发布），Vite + React + TypeScript + Tailwind CSS v4（`@theme` 设计令牌）+ shadcn/ui（Base UI，`components.json` 的 `base-nova`）+ lucide-react + `cn`，JSON 编辑用 `@uiw/react-codemirror`，面板拖拽用 shadcn Resizable（react-resizable-panels），品牌图标（lucide 不提供）用 `@icons-pack/react-simple-icons`。默认深色主题。以 `workspace:*` 依赖本包、按包名 `git-meta-up` 引用：构建与类型检查都走包的 `exports`（`dist` 与 `.d.ts`），等同使用者视角；只有开发服务器用 Vite 别名指向 `../src` 以便热更新。不要在 `playground/tsconfig.json` 里给 `git-meta-up` 加路径映射：Rolldown 会读取它，使构建绕过 `dist`。演示页依赖都在 `playground/package.json`，根 `package.json` 只保留包自身的依赖。`playground/src/components/ui/` 由 shadcn CLI 生成（在 `playground/` 下运行），不参与格式化。

## 约定

- 新增或修改平台模板前，先在浏览器中打开该平台真实仓库的对应页面核对路由，不凭记忆写。
- 凭据不得出现在任何输出中：解析结果、链接、演示页的历史记录都只保留去除凭据后的地址。
- 代码注释与测试描述用英文。示例与测试数据可以使用知名的公开开源仓库，便于辨认平台；其余使用 `example.com`、`owner/repo` 这类占位值，不写入个人或私有仓库、账号、内网域名与 Token。
- 版本与变更日志用 Changesets：对包有用户可见的改动时运行 `pnpm changeset` 记录变更与 semver 级别，不手改 `package.json` 的版本或 `CHANGELOG.md`。`pnpm-workspace.yaml` 显式列出根目录 `.`，否则 Changesets 找不到根目录的包；演示页是私有包，不参与版本与发布。
- 工作流：`ci.yml` 在 push 与 PR 时检查（格式、lint、类型、测试、演示页构建）；`release.yml` 用 `changesets/action` 开版本 PR，合并后以 npm 可信发布（OIDC）+ provenance 发布并打 Tag；`pages.yml` 部署演示页。
- 不执行提交、推送、发布或部署；GitHub Pages 与 npm 可信发布由维护者在平台上配置。

## 验证

- `pnpm check-types`（会先构建包再检查演示页）、`pnpm lint`、`pnpm format:check`、`pnpm test`、`pnpm build`、`pnpm playground:build`。
- 测试以纯函数表驱动为主：地址写法、页面识别、各平台链接、编码、注册优先级、凭据去除。
- 演示页的改动用 `pnpm playground:dev` 或 `pnpm playground:build && pnpm playground:preview` 在浏览器中检查，包括深色与浅色主题、窄屏布局。
