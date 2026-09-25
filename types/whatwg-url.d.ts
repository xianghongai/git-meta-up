/**
 * The WHATWG URL API is built into Node.js and browsers, but TypeScript only types it in the DOM library.
 * The package build excludes DOM and Node types to keep `src/` portable, so the members used are declared here.
 */
declare class URL {
  constructor(input: string, base?: string);
  hostname: string;
  href: string;
  password: string;
  pathname: string;
  port: string;
  protocol: string;
  search: string;
  username: string;
}

declare class URLSearchParams {
  constructor(init?: string | Array<[string, string]>);
  entries(): IterableIterator<[string, string]>;
  get(name: string): string | null;
  toString(): string;
}
