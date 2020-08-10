import { defineElement, html, inject } from '@kirei/element';

export default defineElement({
  name: 'AppView',
  setup() {
    const text = inject('text');

    return () => html`
    <h1>Welcome View</h1>
    <input &=${text}>
    `;
  },
});
