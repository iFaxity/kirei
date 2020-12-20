import { customize, defaultCompiler } from '@kirei/html';
import type { TemplateCompiler } from '@kirei/html';
import { unref, isRef } from '@vue/reactivity';
import { ComponentInstance, getCurrentInstance } from './instance';
import { HookTypes } from './api/lifecycle';

// load directives
import { bind } from './directives/bind';
import { conditionalUnless, conditionalIf } from './directives/conditional';
import { on } from './directives/on';
import { show } from './directives/show';
import { model } from './directives/model';

/**
 * String of allowed characters to use as a directive alias
 */
const ALIAS_NAMES = '@#&$%*!?;=^¶§€';

/**
 * Regex to validate a directive alias
 */
const ALIAS_REGEX = new RegExp(`^([${ALIAS_NAMES}])([a-z0-9-]*)((?:\\.[a-z0-9-]+)*)$`, 'i');

/**
 * Regex to validate directive names
 */
const DIRECTIVE_REGEX = /^v-([a-z0-9-]+)(?:\:([a-z0-9-]*))?((?:\.[a-z0-9-]+)*)$/i;

/**
 * Directive has a set of lifecycle hooks:
 */
export interface Directive<T = any> {
  /**
   * Called before bound element's parent component is mounted
   * @param el - Target element of the directive
   * @param binding - Directive binding
   */
  beforeMount?(el: HTMLElement, binding: DirectiveBinding<T>): void;
  /**
   * Called when bound element's parent component is mounted
   * @param el - Target element of the directive
   * @param binding - Directive binding
   */
  mounted?(el: HTMLElement, binding: DirectiveBinding<T>): void;
  /**
   * Called before the containing component's VNode is updated
   * @param el - Target element of the directive
   * @param binding - Directive binding
   */
  beforeUpdate?(el: HTMLElement, binding: DirectiveBinding<T>): void;
  /**
   * Called after the containing component's VNode and the VNodes of its children // have updated
   * @param el - Target element of the directive
   * @param binding - Directive binding
   */
  updated?(el: HTMLElement, binding: DirectiveBinding<T>): void;
  /**
   * Called before the bound element's parent component is unmounted
   * @param el - Target element of the directive
   * @param binding - Directive binding
   */
  beforeUnmount?(el: HTMLElement, binding: DirectiveBinding<T>): void;
  /**
   * Called when the bound element's parent component is unmounted
   * @param el - Target element of the directive
   * @param binding - Directive binding
   */
  unmounted?(el: HTMLElement, binding: DirectiveBinding<T>): void;
}

export interface DirectiveBinding<T = any> {
  instance: ComponentInstance;
  value: T;
  oldValue: T;
  arg: string;
  modifiers: string[];
  dir: Directive<T>;
}

/**
 * Patcher to set refs value to the targeted element
 * @param el - Element to apply the patcher on
 */
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
 */
export const compiler: TemplateCompiler = {
  attr(node, attr) {
    if (attr === 'ref') {
      return refPatcher(node);
    }

    // Directives starts with v-
    const isAlias = ALIAS_NAMES.includes(attr[0]);
    if (!isAlias && !attr.startsWith('v-')) {
      // Use default patcher
      const patch = defaultCompiler.attr(node, attr);
      return (pending) => patch(unref(pending));
    }

    const match = attr.match(isAlias ? ALIAS_REGEX : DIRECTIVE_REGEX);
    if (!match) {
      throw new TypeError(`Invalid directive format '${attr}'.`);
    }

    // Internal patchers takes precedence
    const name = match[1];
    const el = node as HTMLElement;
    const arg = match[2] ?? '';
    const modifiers = match[3] ? match[3].slice(1).split('.') : [];
    switch (name) {
      case 'bind':
        return bind(el, arg, modifiers);
      case 'if':
        return conditionalIf(el, arg, modifiers);
      case 'unless':
        return conditionalUnless(el, arg, modifiers);
      case 'show':
        return show(el, arg, modifiers);
      case '@':
      case 'on':
        return on(el, arg, modifiers);
      case '&':
      case 'model':
        return model(el, arg, modifiers);
    }

    // Look in element-scoped and global directives for a match
    const instance = getCurrentInstance();
    const dir = instance.directives?.[name];

    if (!dir) {
      throw new TypeError(`Directive ${name} not defined.`);
    }

    const binding: DirectiveBinding = {
      instance, modifiers, dir, arg,
      value: undefined,
      oldValue: undefined,
    };

    // maybe oldValue is not properly set in beforeUpdate?
    // mount called before directive is created?
    for (const key of Object.values(HookTypes)) {
      if (key in dir) {
        instance.injectHook(key, dir[key].bind(null, el, binding));
      }
    }

    // Memo the old value, update current value
    return (pending) => {
      binding.oldValue = binding.value;
      binding.value = pending;
    };
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
