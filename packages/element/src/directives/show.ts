import { unRef } from '@kirei/fx';
import { directive } from '../compiler';

directive('show', dir => {
  const el = dir.el as HTMLElement;
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
