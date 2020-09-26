import { unref } from '@vue/reactivity';
import { TemplatePatcher } from '@kirei/html';
import { directive, Directive } from '../compiler';

function conditionalPatcher(invert: boolean, dir: Directive): TemplatePatcher {
  const placeholder = document.createComment('');
  let node: Element|Comment = dir.el;

  return (pending) => {
    const value = unref(pending);
    const newNode = (invert ? !value : value) ? dir.el : placeholder;

    if (newNode !== node) {
      node.parentNode?.replaceChild(newNode, node);
      node = newNode;
    }
  };
}

directive('if', conditionalPatcher.bind(null, false));
directive('unless', conditionalPatcher.bind(null, false));

