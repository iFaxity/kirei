import { unref } from '@vue/reactivity';
import { directive } from '../compiler';

export default directive('if', dir => {
  const { el, arg } = dir;
  const invert = arg == 'not';
  const placeholder = document.createComment('');
  let node: Element|Comment = el;

  return pending => {
    const value = unref(pending);
    const newNode = (invert ? !value : !!value) ? el : placeholder;

    if (newNode !== node) {
      node.parentNode?.replaceChild(newNode, node);
      node = newNode;
    }
  };
});
