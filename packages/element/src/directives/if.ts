import { directive, Directive } from '../directive';
import { unRef } from '@shlim/fx';

directive('if', dir => {
  const { el, arg } = dir;
  const invert = arg == 'not';
  const comment = document.createComment('');
  let oldNode: HTMLElement | Comment = el;
  let value: boolean = true;

  return (pending) => {
    const newValue = unRef(pending);
    const res = invert ? !newValue : !!newValue;

    if (value !== res) {
      const newNode = res ? el : comment;
      if (newNode !== oldNode) {
        oldNode.parentNode?.replaceChild(newNode, oldNode);
      }

      oldNode = newNode;
      value = res;
    }
  };
});
