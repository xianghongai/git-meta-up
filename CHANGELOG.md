# Changelog

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## 0.1.2

### Patch Changes

- [`f13ae9c`](https://github.com/xianghongai/git-meta-up/commit/f13ae9c6afb245c143e1417588ab599d80b394f3) Thanks [@xianghongai](https://github.com/xianghongai)! - Link the online playground from the README and make the CI/CD workflows reusable across packages.

  - Link the playground on GitHub Pages at the top of the README and in its Playground section.
  - Rename the `playground:*` scripts to `site:build`, `site:dev` and `site:preview`.
  - Workflows no longer name this package: they call the conventional root scripts (`format:check`, `lint`, `check-types`, `test`, `release`, `site:build`), CI skips the site build when `site:build` is absent, and the site output directory is set once through `SITE_DIR` in `pages.yml`.
  - Give the workflows generic names and run names.

## 0.1.1

### Patch Changes

- [`7de6def`](https://github.com/xianghongai/git-meta-up/commit/7de6def86b28361c507644e56f7db70d8daa8c52) Thanks [@xianghongai](https://github.com/xianghongai)! - Split the playground into its own pnpm workspace package and automate releases.

  - Move the playground to `playground/` as a private workspace package that consumes `git-meta-up` through `workspace:*`; its build and type check use the built `dist`, so it runs the package as a consumer would.
  - Release with Changesets: merging the version PR publishes to npm through trusted publishing with provenance, tags the release and creates a GitHub release. CI now only runs checks.
  - Playground: one-line header with the project icon and a GitHub link, dark theme by default, resizable History panel, Remote config filling the remaining space, a help card listing the supported provider types, and snake_case keys in the result.

## 0.1.0 (2026-09-25)

- Parse HTTPS, `ssh://`, `git://`, scp-style and browser page URLs, removing credentials.
- Built-in providers: GitHub, GitLab, Gitea (Codeberg), Bitbucket, Bitbucket Server, Azure DevOps, Gitee, CNB and Codeup.
- Recognize which page a pasted URL points at (`remote.page`), reading refs and file paths from it.
- Register self-hosted domains in the GitLens `gitlens.remotes` shape, including `Custom` link templates.
- Links for the repository, owner, branches, a branch, commit history, tags, a tag, a commit, a comparison, and a file's page, raw content, blame and history; HTTPS and SSH clone URLs.
- Playground for GitHub Pages (React, Tailwind CSS v4, shadcn/ui): paste any remote or page URL, edit the remote config, keep a parse history, switch light/dark.
