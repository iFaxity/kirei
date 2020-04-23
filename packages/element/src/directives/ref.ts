import { Ref, isRef } from '@kirei/fx';
import { directive } from '../compiler';

// This is a special directive
directive('ref', dir => {
  return (ref: Ref<Element>) => {
    if (!isRef(ref)) {
      throw new TypeError('Ref directive requires a ref as it\'s expression value');
    }

    ref.value = dir.el;
  };
});
