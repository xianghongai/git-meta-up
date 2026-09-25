---
'git-meta-up': patch
---

Split the playground into its own pnpm workspace package and automate releases.

- Move the playground to `playground/` as a private workspace package that consumes `git-meta-up` through `workspace:*`; its build and type check use the built `dist`, so it runs the package as a consumer would.
- Release with Changesets: merging the version PR publishes to npm through trusted publishing with provenance, tags the release and creates a GitHub release. CI now only runs checks.
- Playground: one-line header with the project icon and a GitHub link, dark theme by default, resizable History panel, Remote config filling the remaining space, a help card listing the supported provider types, and snake_case keys in the result.
