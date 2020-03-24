import { Ref, isRef } from '@shlim/fx';
import { directive } from '@shlim/html';

// This is a special directive
directive('ref', dir => {
  return (ref: Ref<Element>) => {
    if (!isRef(ref)) {
      throw new TypeError('Ref directive requires a ref as it\'s expression value');
    }

    ref.value = dir.el;
  };
});
