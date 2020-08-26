import { unRef } from '@kirei/fx';
import { directive } from '../compiler';

directive('if', dir => {
  const { el, arg } = dir;
  const invert = arg == 'not';
  const placeholder = document.createComment('');
  let node: Element|Comment = el;

  return pending => {
    const value = unRef(pending);
    const newNode = (invert ? !value : !!value) ? el : placeholder;

    if (newNode !== node) {
      node.parentNode?.replaceChild(newNode, node);
      node = newNode;
    }
  };
});
