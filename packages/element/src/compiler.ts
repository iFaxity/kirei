import { TemplatePatcher, TemplateCompiler, customize, defaultCompiler } from '@kirei/html';
import { unRef } from '@kirei/fx';
import { FxInstance } from './instance';

export type DirectiveFactory = (directive: Directive) => TemplatePatcher;
export interface Directive {
  el: HTMLElement;
  name: string;
  arg: string;
  mods: string[];
}

const aliases: string[] = [];
const directives: Record<string, DirectiveFactory> = Object.create(null);
const DIRECTIVE_REGEX = /^([a-z0-9@#&$%*!?;=^-]+)(?:\:([a-z0-9-]*))?((?:\.[a-z0-9-]+)*)$/i;

// directive name
export function directive(name: string, directive: DirectiveFactory): void {
  if (typeof name != 'string') {
    throw new TypeError('Invalid directive name');
  } else if (directives[name]) {
    throw new Error('Directive already exists');
  }

  if (name.length == 1) {
    aliases.push(name);
  }
  directives[name] = directive;
}

// Custom compiler for directives and to unpack reactives
const compiler: TemplateCompiler = {
  attr(node, attr) {
    // Check if directive exists for attribute
    if (aliases.includes(attr[0])) {
      attr = `${attr[0]}:${attr.slice(1)}`;
    }

    const match = attr.match(DIRECTIVE_REGEX);
    if (!match) {
      throw new TypeError('Invalid directive format');
    }

    const name = match[1];
    const factory = directives[name] ?? FxInstance.active.directives?.[name];

    if (factory) {
      return factory.call(null, {
        el: node, name,
        arg: match[2] ?? '',
        mods: match[3] ? match[3].slice(1).split('.') : [],
      });
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

export const { html, svg, render } = customize({ compiler });
