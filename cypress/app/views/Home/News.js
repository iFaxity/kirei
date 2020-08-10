import { defineElement, html, inject } from '@kirei/element';

export default defineElement({
  name: 'AppHomeNews',
  setup() {
    const text = inject('text');

    return () => html`
    <h1>Home news subview</h1>
    <input &=${text}>
    `;
  },
});
