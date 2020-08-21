import { TemplatePatcher, TemplateCompiler, customize, defaultCompiler } from '@kirei/html';
import { unRef } from '@kirei/fx';
import { KireiInstance } from './instance';
import { isFunction, isString } from '@kirei/shared';

/**
 * @interface
 */
export interface Directive {
  el: Element;
  name: string;
  arg: string;
  mods: string[];
}

/**
 * Function that is used to describe a directive, for custom interpolation
 * @type
 */
export type DirectiveFactory = (directive: Directive) => TemplatePatcher;

/**
 * , only exported for testing
 * @const {Set<string>}
 * @private
 */
export const aliases = new Set<string>();

/**
 * , only exported for testing
 * @const {Map<string, DirectiveFactory>}
 * @private
 */
export const directives = new Map<string, DirectiveFactory>();

/**
 * Regex to validate directive names and aliases
 * @const {RegExp}
 */
const DIRECTIVE_REGEX = /^([a-z0-9@#&$%*!?;=^-]+)(?:\:([a-z0-9-]*))?((?:\.[a-z0-9-]+)*)$/i;

/**
 * Assigns a new global directive, active for all elements
 * @param {string} name if name is only one char, it is considered an alias
 * @param {DirectiveFactory} directive Directive factory, a function that returns a function with one parameter
 * @returns {void}
 */
export function directive(name: string, directive: DirectiveFactory): void {
  if (!isString(name)) {
    throw new TypeError('Invalid directive name');
  } else if (directives.has(name)) {
    throw new Error('Directive already exists');
  } else if (!isFunction(directive)) {
    throw new TypeError('Directive has to be a function.');
  }

  if (name.length == 1) {
    aliases.add(name);
  }
  directives.set(name, directive);
}

/**
 * Custom compiler for directives and to unpack reactives
 * @const {TemplateCompiler}
 */
const compiler: TemplateCompiler = {
  attr(node, attr) {
    // Check if directive exists for attribute
    if (aliases.has(attr[0])) {
      attr = `${attr[0]}:${attr.slice(1)}`;
    }

    const match = attr.match(DIRECTIVE_REGEX);
    if (!match) {
      throw new TypeError('Invalid directive format');
    }

    const name = match[1];
    const factory = KireiInstance.active?.directives?.[name] ?? directives.get(name);
    if (factory) {
      return factory({
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
