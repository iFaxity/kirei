export type DirectiveUpdater = (newValue: unknown) => void;
export type DirectiveFactory = (directive: Directive) => DirectiveUpdater;
export interface Directive {
  el: HTMLElement;
  name: string;
  arg: string;
  mods: string[];
}

const shorthands = new Map<string, string>();
const directives = new Map<string, DirectiveFactory>();
const DIRECTIVE_REGEX = /^([a-z0-9-]+)(?:\:([a-z0-9-]*))?((?:\.[a-z0-9-]+)*)$/i;

export function parseDirective(node: Element, name: string): DirectiveUpdater {
  const shorthand = shorthands.get(name[0]);
  if (shorthand) {
    name = `${shorthand}:${name.slice(1)}`;
  }

  const match = name.match(DIRECTIVE_REGEX);
  if (!match) {
    throw new TypeError('Invalid directive format');
  }

  const factory = directives.get(match[1]);
  if (factory) {
    const directive = {
      el: node,
      name: match[1],
      arg: match[2] ?? '',
      mods: match[3] ? match[3].slice(1).split('.') : [],
    } as Directive;
    return factory.call(null, directive);
  }

  return null;
}

// directive name or [name, shorthand]
export function directive(key: string|[string,string], directive: DirectiveFactory): void {
  let name = key as string;
  let shorthand: string;
  if (Array.isArray(key)) {
    [name, shorthand] = key;

    if (typeof shorthand != 'string' || shorthand.length != 1) {
      throw new TypeError('Directive shorthands must be a string with exactly one character!');
    }
  }

  if (!name || typeof name != 'string') {
    throw new TypeError('Directive names must be a string with at least one character');
  } else if (directives.has(name)) {
    throw new Error('Directive already exists');
  } else if (shorthands.has(shorthand)) {
    throw new Error('Shorthand for directive already exists');
  }

  directives.set(name, directive);
  if (shorthand) {
    shorthands.set(shorthand, name);
  }
}
