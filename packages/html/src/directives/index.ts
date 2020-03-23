import { Ref, isRef } from '@shlim/fx';

export type DirectiveUpdater = (newValue: unknown) => void;
export type DirectiveFactory = (directive: Directive) => DirectiveUpdater;
export interface Directive {
  el: HTMLElement;
  name: string;
  arg: string;
  mods: string[];
}

const directives = new Map<string, DirectiveFactory>();
const DIRECTIVE_REGEX = /^([a-z0-9-]+)(:([a-z0-9-]+))?((?:\.[a-z0-9-]+)*)$/i;

export function parseDirective(
  name: string,
  node: Element,
  factory?: DirectiveFactory
): DirectiveUpdater {
  const match = name.match(DIRECTIVE_REGEX);
  if (!match) {
    throw new TypeError('Invalid directive format');
  }

  const directive = {
    el: node,
    name: match[1],
    arg: match[3] ?? '',
    mods: match[4] ? match[3].slice(1).split('.') : [],
  } as Directive;

  if (!factory) {
    factory = directives.get(directive.name);

    if (!factory) {
      throw new Error(`Directive "${directive.name}" doesn't exist`);
    }
  }
  return factory.call(null, directive);
}

export function refDirective(dir: Directive) {
  return (ref: Ref<Element>) => {
    if (!isRef(ref)) {
      throw new TypeError('Ref directive requires a ref as it\'s expression value');
    }

    ref.value = dir.el;
  };
}

export function directive(key: string, directive: DirectiveFactory): void {
  if (directives.has(key)) {
    throw new Error('directive already exists');
  }

  directives.set(key, directive);
}


// Default directives
//ref
//v-bind, .
//v-on, @
//v-if
//v-not
//v-sync, &
