import { defineElement, html, inject } from '@kirei/element';

export default defineElement({
  name: 'AppUsers',
  setup() {
    const text = inject('text');

    return () => html`
    <h1>Users view</h1>
    <input &=${text}>
    `;
  },
});
