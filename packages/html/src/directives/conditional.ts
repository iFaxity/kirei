import { directive, Directive } from '../directive';
import { toRawValue } from '@shlim/fx';

function conditional(invert: boolean, dir: Directive) {
  const { el } = dir;
  const comment = document.createComment('');
  let oldNode: HTMLElement | Comment = el;
  let value: boolean = true;

  return (newValue: unknown) => {
    newValue = toRawValue(newValue);
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
}

directive('if', dir => conditional(false, dir));
directive('unless', dir => conditional(true, dir));
