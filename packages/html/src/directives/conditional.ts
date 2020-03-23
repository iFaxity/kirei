import { directive, Directive } from './';
import { toRawValue } from '@shlim/fx/dist';

function conditional(invert: boolean = false, dir: Directive) {
  const { el } = dir;
  let value: boolean;
  let comment = document.createComment('');

  return (newValue: any) => {
    newValue = toRawValue(newValue);
    const res = invert ? !newValue : !!newValue;

    if (value !== res) {
      const oldChild = value ? comment : el;
      const newChild = value ? el : comment;

      oldChild.parentNode?.replaceChild(newChild, oldChild);
      value = value;
    }
  };
}

directive('if', dir => conditional(false, dir));
directive('unless', dir => conditional(true, dir));
