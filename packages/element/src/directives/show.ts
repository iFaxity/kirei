import { directive } from '../directive';
import { unRef } from '@shlim/fx';

directive('show', dir => {
  const { el } = dir;
  let value: boolean = true;

  return (pending) => {
    const newValue = !!unRef(pending);

    if (newValue) {
      if (!value) {
        el.style.display = '';
      }
    } else if (value) {
      el.style.display = 'none';
    }

    value = newValue;
  };
});
