/**
 * Turn a GitLens-style `${…}` link template into a path-to-regexp path and a list of query parameters,
 * so links are built with `compile()` and page URLs are read back with `match()`.
 */
import { compile, match } from 'path-to-regexp';
import type { GitPage } from './types.js';

export type RefKey = Exclude<keyof GitPage, 'kind'>;

/** Values that may span several path segments use wildcards; the others take a single segment. */
const refKeys: Record<RefKey, 'wildcard' | 'segment'> = {
  branch: 'wildcard',
  file: 'wildcard',
  tag: 'segment',
  ref: 'segment',
  id: 'segment',
  base: 'segment',
  head: 'segment',
};

const isRefKey = (key: string): key is RefKey => key in refKeys;

/** path-to-regexp treats these as syntax; everything else in a template is literal text. */
const escapePath = (text: string): string => text.replace(/[{}()[\]+?!:*\\]/g, '\\$&');

export interface Route {
  /** Origin the link starts with: the remote's, or the absolute one written in a Custom template. */
  origin: string;
  /** path-to-regexp pattern of the path. */
  path: string;
  /** Query parameters; values may hold `${…}` placeholders. */
  query: Array<[name: string, value: string]>;
}

/** `raw` holds the repository values (`origin`, `repo`, `owner`, …) that are inserted as they are. */
export const toRoute = (template: string, raw: Record<string, string>): Route => {
  const absolute = /^[a-z][a-z0-9+.-]*:\/\/[^/?#]+/i.exec(template)?.[0];
  const origin = absolute ?? (template.startsWith('${origin}') ? (raw.origin ?? '') : '');
  const rest = absolute ? template.slice(absolute.length) : template.replace(/^\$\{origin\}/, '');
  const queryStart = rest.indexOf('?');
  const pathTemplate = queryStart < 0 ? rest : rest.slice(0, queryStart);
  let path = '';
  let last = 0;
  for (const placeholder of pathTemplate.matchAll(/\$\{(\w+)\}/g)) {
    path += escapePath(pathTemplate.slice(last, placeholder.index));
    const key = placeholder[1]!;
    if (isRefKey(key)) {
      path += refKeys[key] === 'wildcard' ? `*${key}` : `:${key}`;
    } else {
      path += escapePath(raw[key] ?? placeholder[0]);
    }
    last = placeholder.index + placeholder[0].length;
  }
  path += escapePath(pathTemplate.slice(last));
  const query = queryStart < 0 ? [] : [...new URLSearchParams(rest.slice(queryStart + 1)).entries()];
  return { origin, path, query };
};

const placeholders = /\$\{(\w+)\}/g;

const encodeSegments = (value: string): string => value.split('/').map(encodeURIComponent).join('/');

/** Build a link: the path through path-to-regexp (per-segment encoding), the query through URLSearchParams. */
export const buildRoute = (route: Route, values: Partial<Record<RefKey, string>>): string => {
  const params: Record<string, string | string[]> = {};
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && isRefKey(key)) {
      params[key] = refKeys[key] === 'wildcard' ? value.split('/').filter(Boolean) : value;
    }
  }
  // Keep `/` inside single-segment values too, e.g. a branch name used as the ref of a file link.
  const path = compile(route.path, { encode: encodeSegments })(params);
  const search = new URLSearchParams(
    route.query.map(([name, value]) => [
      name,
      value.replace(placeholders, (text, key: string) => (isRefKey(key) ? (values[key] ?? text) : text)),
    ])
  ).toString();
  return `${route.origin}${path}${search ? `?${search}` : ''}`;
};

const escapeRegExp = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Read a page URL back against a route. Returns the captured values, or undefined when it does not match.
 * Extra query parameters are ignored; `alternatives` adds path patterns that read the same values.
 */
export const matchRoute = (
  route: Route,
  pathname: string,
  search: URLSearchParams,
  alternatives: string[] = []
): Partial<Record<RefKey, string>> | undefined => {
  let found: ReturnType<ReturnType<typeof match>> = false;
  for (const path of [route.path, ...alternatives]) {
    found = match(path)(pathname);
    if (found) {
      break;
    }
  }
  if (!found) {
    return undefined;
  }
  const values: Partial<Record<RefKey, string>> = {};
  for (const [key, value] of Object.entries(found.params)) {
    if (isRefKey(key) && value !== undefined) {
      values[key] = Array.isArray(value) ? value.filter(Boolean).join('/') : value;
    }
  }
  for (const [name, template] of route.query) {
    const actual = search.get(name);
    if (actual === null) {
      return undefined;
    }
    const keys: RefKey[] = [];
    const pattern = template
      .split(placeholders)
      .map((part, index) => {
        if (index % 2 === 0) {
          return escapeRegExp(part);
        }
        if (isRefKey(part)) {
          keys.push(part);
        }
        return '(.+)';
      })
      .join('');
    const captured = new RegExp(`^${pattern}$`).exec(actual);
    if (!captured) {
      return undefined;
    }
    keys.forEach((key, index) => {
      values[key] = captured[index + 1]!;
    });
  }
  return values;
};
