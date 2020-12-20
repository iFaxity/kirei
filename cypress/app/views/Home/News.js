import { defineComponent, html, inject } from '@kirei/element';

export default defineComponent({
  name: 'AppHomeNews',
  setup() {
    const text = inject('text');

    return () => html`
    <h1>Home news subview</h1>
    <input &=${text}>
    `;
  },
});
