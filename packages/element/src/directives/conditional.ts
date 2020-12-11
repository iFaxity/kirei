import { unref } from '@vue/reactivity';
import type { TemplatePatcher } from '@kirei/html';

export function conditionalUnless(el: HTMLElement, arg: string, modifiers: string[]): TemplatePatcher {
  const placeholder = document.createComment('');
  let node: Element|Comment = el;

  return (pending) => {
    const value = unref(pending);
    const newNode = value ? placeholder : el;

    if (newNode !== node) {
      node.parentNode?.replaceChild(newNode, node);
      node = newNode;
    }
  };
}

export function conditionalIf(el: HTMLElement, arg: string, modifiers: string[]): TemplatePatcher {
  const placeholder = document.createComment('');
  let node: Element|Comment = el;

  return (pending) => {
    const value = unref(pending);
    const newNode = value ? el : placeholder;

    if (newNode !== node) {
      node.parentNode?.replaceChild(newNode, node);
      node = newNode;
    }
  };
}

