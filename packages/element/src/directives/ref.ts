import { isRef } from '@kirei/fx';
import { directive } from '../compiler';

// This is a special directive
export default directive('ref', dir => {
  return ref => {
    if (!isRef<Element>(ref)) {
      throw new TypeError(`Ref directive requires a ref as its expression value`);
    }

    ref.value = dir.el;
  };
});
