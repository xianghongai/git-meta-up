---
'git-meta-up': patch
---

Link the online playground from the README and make the CI/CD workflows reusable across packages.

- Link the playground on GitHub Pages at the top of the README and in its Playground section.
- Rename the `playground:*` scripts to `site:build`, `site:dev` and `site:preview`.
- Workflows no longer name this package: they call the conventional root scripts (`format:check`, `lint`, `check-types`, `test`, `release`, `site:build`), CI skips the site build when `site:build` is absent, and the site output directory is set once through `SITE_DIR` in `pages.yml`.
- Give the workflows generic names and run names.
