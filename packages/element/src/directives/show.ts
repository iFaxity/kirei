import { defineDirective } from '../directive';
import { isRef } from '@shlim/fx';

defineDirective('show', dir => {
  const { el } = dir;
  let value: boolean = true;

  return (newValue) => {
    if (isRef(newValue)) {
      newValue = newValue.value;
    }

    if (newValue && !value) {
      el.style.display = '';
    } else if (!newValue && value) {
      el.style.display = 'none';
    }

    value = !!newValue;
  };
});
