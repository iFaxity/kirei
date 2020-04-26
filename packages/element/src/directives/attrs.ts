import { directive } from '../compiler';
import { isObject, warn } from '@kirei/shared';

directive('attrs', dir => {
  const { el } = dir;

  return (pending: any) => {
    if (!isObject(pending)) {
      return warn('Directive requires the expression value to be an object', 'attrs (directive)');
    }

    for (const key of Object.keys(pending)) {
      const value = pending[key];
      if (value) {
        const attr = el.getAttributeNode(key) ?? document.createAttribute(key);
        attr.value = value;
      } else {
        el.removeAttribute(key);
      }
    }
  };
});
