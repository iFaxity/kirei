import { defineElement, html, inject } from '@kirei/element';

export default defineElement({
  name: 'AppHomeView',
  setup() {
    const text = inject('text');

    return () => html`
    <h1>Home subview</h1>
    <input &=${text}>
    `;
  },
});
