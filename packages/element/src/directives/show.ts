import { unRef } from '@kirei/fx';
import { directive } from '../compiler';

directive('show', dir => {
  const el = dir.el as HTMLElement;
  let value = true;

  return (pending) => {
    const newValue = !!unRef(pending);

    if (newValue != value) {
      el.style.display = newValue ? '' : 'none';
    }

    value = newValue;
  };
});
