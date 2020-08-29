import { isObject } from '@kirei/shared';
import { directive } from '../compiler';
import { warn } from '../logging';

export default directive('attrs', dir => {
  const { el } = dir;

  return pending => {
    if (!isObject(pending)) {
      return warn('Directive requires the expression value to be an object', 'attrs (directive)');
    }

    for (const key of Object.keys(pending)) {
      const value = pending[key];

      value ? el.setAttribute(key, value) : el.removeAttribute(key);
    }
  };
});
