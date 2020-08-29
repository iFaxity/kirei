import { TemplatePatcher, TemplateCompiler, customize, defaultCompiler } from '@kirei/html';
import { unRef } from '@kirei/fx';
import { KireiInstance } from './instance';
import { isFunction, isString } from '@kirei/shared';

/**
 * String of allowed characters to use as a directive alias
 * @const {string}
 */
const ALIAS_NAMES = '@#&$%*!?;=^¶§€';

/**
 * Regex to validate a directive alias
 * @const {RegExp}
 */
const ALIAS_REGEX = new RegExp(`^([${ALIAS_NAMES}])([a-z0-9-]*)((?:\.[a-z0-9-]+)*)$`, 'i');

/**
 * Regex to validate directive names
 * @const {RegExp}
 */
const DIRECTIVE_REGEX = /^([a-z0-9-]+)(?:\:([a-z0-9-]*))?((?:\.[a-z0-9-]+)*)$/i;

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
 * Map of global directives, only exported for testing purposes
 * @const {Map<string, DirectiveFactory>}
 * @private
 */
export const directives = new Map<string, DirectiveFactory>();

/**
 * Assigns a new global directive, active for all elements
 * @param {string} name if name is only one char, it is considered an alias
 * @param {DirectiveFactory} directive Directive factory, a function that returns a function with one parameter
 * @returns {DirectiveFactory}
 */
export function directive(name: string, directive: DirectiveFactory): DirectiveFactory {
  if (!isString(name)) {
    throw new TypeError('Invalid directive name');
  } else if (!isFunction(directive)) {
    throw new TypeError('Directive has to be a function.');
  } else if (directives.has(name)) {
    throw new Error('Directive already exists');
  }

  if (name.length == 1 && !ALIAS_NAMES.includes(name)) {
    throw new TypeError('Alias invalid, use a special character instead');
  }
  return directives.set(name, directive), directive;
}

/**
 * Custom compiler for directives and to unpack reactives
 * @const {TemplateCompiler}
 */
const compiler: TemplateCompiler = {
  attr(node, attr) {
    const isAlias = ALIAS_NAMES.includes(attr[0]);
    const match = attr.match(isAlias ? ALIAS_REGEX : DIRECTIVE_REGEX);
    if (!match) {
      throw new TypeError(`Invalid directive format '${attr}'.`);
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
    const patch = defaultCompiler.attr(node, attr);
    return (newValue) => patch(unRef(newValue));
  },
  node(ref) {
    const patch = defaultCompiler.node(ref)
    return (newValue) => patch(unRef(newValue));
  },
  text(node) {
    const patch = defaultCompiler.text(node);
    return (newValue) => patch(unRef(newValue));
  },
};

export const { html, svg, render } = customize({ compiler });
