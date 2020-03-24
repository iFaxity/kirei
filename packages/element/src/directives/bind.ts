import { defineDirective } from '../directive';
import { isObject, warn } from '@shlim/shared';

defineDirective(['bind', '.'], dir => {
  const { el, arg } = dir;

  // Special
  if (arg) {
    return (newValue: any) => { el[arg] = newValue; }
  }

  return (newValue: any) => {
    if (!isObject(newValue)) {
      return warn('Directive requires the expression value to be an object', 'v-bind (directive)');
    }

    for (const [key, value] of Object.entries(newValue)) {
      if (value) {
        const attr = el.getAttributeNode(key) ?? document.createAttribute(key);
        attr.value = value;
      } else {
        el.removeAttribute(key);
      }
    }
  };
});
