import { TemplatePatcher, TemplateCompiler, defaultCompiler } from '@shlim/html';
import { unRef } from '@shlim/fx';

export type DirectiveFactory = (directive: Directive) => TemplatePatcher;
export interface Directive {
  el: HTMLElement;
  name: string;
  arg: string;
  mods: string[];
}

const aliases = new Set<string>();
const directives = new Map<string, DirectiveFactory>();
const DIRECTIVE_REGEX = /^([a-z0-9@#&$%*!?;=^-]+)(?:\:([a-z0-9-]*))?((?:\.[a-z0-9-]+)*)$/i;

// directive name
export function directive(name: string, directive: DirectiveFactory): void {
  if (typeof name != 'string') {
    throw new TypeError('Invalid directive name');
  } else if (directives.has(name)) {
    throw new Error('Directive already exists');
  }

  if (name.length == 1) {
    aliases.add(name);
  }
  directives.set(name, directive);
}

// Custom compiler for directives and to unpack reactives
export const compiler: TemplateCompiler = {
  attr(node, attr) {
    // Check if directive exists for attribute
    if (aliases.has(attr[0])) {
      attr = `${attr[0]}:${attr.slice(1)}`;
    }

    const match = attr.match(DIRECTIVE_REGEX);
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

    // Use default patcher
    const patch = defaultCompiler.attr(node, attr) as TemplatePatcher;
    return (newValue) => patch(unRef(newValue));
  },
  node(ref) {
    const patch = defaultCompiler.node(ref) as TemplatePatcher;
    return (newValue) => patch(unRef(newValue));
  },
  text(node) {
    const patch = defaultCompiler.text(node) as TemplatePatcher;
    return (newValue) => patch(unRef(newValue));
  },
};
