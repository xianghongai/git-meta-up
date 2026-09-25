# Changelog

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## 0.1.0 (2026-09-25)

- Parse HTTPS, `ssh://`, `git://`, scp-style and browser page URLs, removing credentials.
- Built-in providers: GitHub, GitLab, Gitea (Codeberg), Bitbucket, Bitbucket Server, Azure DevOps, Gitee, CNB and Codeup.
- Recognize which page a pasted URL points at (`remote.page`), reading refs and file paths from it.
- Register self-hosted domains in the GitLens `gitlens.remotes` shape, including `Custom` link templates.
- Links for the repository, owner, branches, a branch, commit history, tags, a tag, a commit, a comparison, and a file's page, raw content, blame and history; HTTPS and SSH clone URLs.
- Playground for GitHub Pages (React, Tailwind CSS v4, shadcn/ui): paste any remote or page URL, edit the remote config, keep a parse history, switch light/dark.
