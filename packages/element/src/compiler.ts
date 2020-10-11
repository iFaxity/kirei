import { customize, defaultCompiler } from '@kirei/html';
import type { TemplatePatcher, TemplateCompiler } from '@kirei/html';
import { unref, isRef } from '@vue/reactivity';
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
const DIRECTIVE_REGEX = /^x-([a-z0-9-]+)(?:\:([a-z0-9-]*))?((?:\.[a-z0-9-]+)*)$/i;

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
export const aliases = new Map<string, string>();

/**
 * Assigns a new global directive, active for all elements
 * @param {string} name if name is only one char, it is considered an alias
 * @param {DirectiveFactory} directive Directive factory, a function that returns a function with one parameter
 * @returns {DirectiveFactory}
 */
export function directive(name: string|[string, string], directive: DirectiveFactory): DirectiveFactory {
  let alias: string;
  if (Array.isArray(name)) {
    [ name, alias ] = name;
  }

  if (!isString(name)) {
    throw new TypeError('Invalid directive name');
  } else if (!isFunction(directive)) {
    throw new TypeError('Directive has to be a function.');
  } else if (directives.has(name)) {
    throw new TypeError('Directive already exists');
  }

  if (alias) {
    if (alias.length != 1 || !ALIAS_NAMES.includes(alias)) {
      throw new TypeError('Alias invalid, use a special character instead');
    } else if (aliases.has(alias)) {
      throw new TypeError('Directive alias already exists');
    }

    aliases.set(alias, name);
  }

  return directives.set(name, directive), directive;
}

// This is a special patcher
function refPatcher(el: Element) {
  return (ref) => {
    if (!isRef<Element>(ref)) {
      throw new TypeError(`Ref directive requires a ref as its expression value`);
    }

    ref.value = el;
  };
}

/**
 * Custom compiler for directives and to unpack reactives
 * @const {TemplateCompiler}
 */
export const compiler: TemplateCompiler = {
  attr(node, attr) {
    if (attr === 'ref') {
      return refPatcher(node);
    }

    // Directives starts with x- or aliased name
    const isAlias = ALIAS_NAMES.includes(attr[0]);
    if (isAlias || attr.startsWith('x-')) {
      const match = attr.match(isAlias ? ALIAS_REGEX : DIRECTIVE_REGEX);
      if (!match) {
        throw new TypeError(`Invalid directive format '${attr}'.`);
      }

      // Proxy the alias to the real directive name
      const name = isAlias ? aliases.get(match[1]) : match[1];
      const factory = KireiInstance.active?.directives?.[name] ?? directives.get(name);
      if (factory) {
        return factory({
          el: node, name,
          arg: match[2] ?? '',
          mods: match[3] ? match[3].slice(1).split('.') : [],
        });
      }
    }

    // Use default patcher
    const patch = defaultCompiler.attr(node, attr);
    return (pending) => patch(unref(pending));
  },
  node(ref) {
    const patch = defaultCompiler.node(ref)
    return (pending) => patch(unref(pending));
  },
  text(node) {
    const patch = defaultCompiler.text(node);
    return (pending) => patch(unref(pending));
  },
};

export const { html, svg, render } = customize({ compiler });
