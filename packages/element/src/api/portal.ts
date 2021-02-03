import { onMount } from './lifecycle';
import { getCurrentInstance } from '../runtime/instance';
import { defineComponent } from './defineComponent';

defineComponent({
  name: 'VPortal',
  setup() {
    const { el } = getCurrentInstance();
    const $body = window.document.body;
    const $slot = document.createElement('slot');

    // Ensure the elements parent is the body
    onMount(() => {
      if (el.parentNode != $body) {
        $body.appendChild(el);
      }
    });

    // patching should already be done by the parent component
    // this element just moves the elements to another root
    return () => $slot;
  },
});
