import { unref } from '@vue/reactivity';
import { directive } from '../compiler';

export default directive('show', dir => {
  const el = dir.el as HTMLElement;
  let value = true;

  return (pending) => {
    const newValue = !!unref(pending);

    if (newValue != value) {
      el.style.display = newValue ? '' : 'none';
    }

    value = newValue;
  };
});
