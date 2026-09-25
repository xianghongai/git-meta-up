/**
 * Recognize which page a web URL points at by reading it back against the provider's link templates.
 */
import { matchRoute, toRoute } from './route.js';
import type { GitPage, GitRemote, GitUrlKind } from './types.js';
import { repositoryValues } from './urls.js';

/** Most specific first, so `commits/{ref}/{file}` wins over `commits/{ref}`. */
const kinds: GitUrlKind[] = [
  'compare',
  'history',
  'blame',
  'raw',
  'file',
  'commit',
  'commits',
  'tag',
  'branch',
  'tags',
  'branches',
];

/** Whether a tag and a branch template describe the same route, e.g. `/tree/${tag}` and `/tree/${branch}`. */
const sameRoute = (tag: string, branch: string | undefined): boolean =>
  branch !== undefined && tag.replace('${tag}', '${ref}') === branch.replace('${branch}', '${ref}');

/**
 * Some providers (Gitee, Codeup) use one URL for branches and tags. A version-like name is taken as a tag,
 * anything else as a branch.
 */
const branchOrTag = (page: GitPage): GitPage =>
  /^v?\d+(\.\d+)+/.test(page.tag ?? '') ? page : { kind: 'branch', branch: page.tag! };

/** `route` is the raw path and query of the input URL. */
export const matchPage = (remote: GitRemote, route: string): GitPage | undefined => {
  const queryStart = route.indexOf('?');
  let pathname = queryStart < 0 ? route : route.slice(0, queryStart);
  const search = new URLSearchParams(queryStart < 0 ? '' : route.slice(queryStart + 1));
  // The origin may carry a context path (Bitbucket Server); templates are matched below it.
  const contextPath = new URL(remote.origin).pathname.replace(/\/$/, '');
  if (contextPath && pathname.toLowerCase().startsWith(contextPath.toLowerCase())) {
    pathname = pathname.slice(contextPath.length);
  }
  const raw = { ...repositoryValues(remote), origin: '' };
  for (const kind of kinds) {
    const template = remote.templates[kind];
    if (!template) {
      continue;
    }
    const pageRoute = toRoute(template, raw);
    // Comparison pages accept two-dot ranges as well.
    const alternatives = pageRoute.path.includes('...') ? [pageRoute.path.replace('...', '..')] : [];
    const values = matchRoute(pageRoute, pathname, search, alternatives);
    if (values) {
      const page: GitPage = { kind, ...values };
      return kind === 'tag' && sameRoute(template, remote.templates.branch) ? branchOrTag(page) : page;
    }
  }
  // Checked last: some providers put refs in the query of the repository URL (`?version=GBmain`).
  // The repository page also matches its HTTPS clone URL, which may use another path (`/scm/…` on Bitbucket Server).
  const repository = toRoute(remote.templates.repository ?? '${origin}/${repo}', raw);
  const clone = remote.templates.cloneHttps ? toRoute(remote.templates.cloneHttps, raw) : undefined;
  const isRepository =
    matchRoute({ ...repository, path: `${repository.path}{.git}` }, pathname, search) !== undefined ||
    (clone !== undefined && matchRoute(clone, pathname, search) !== undefined);
  return isRepository ? { kind: 'repository' } : undefined;
};
