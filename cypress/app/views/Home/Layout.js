import { defineElement, html } from '@kirei/element';

export default defineElement({
  name: 'AppHome',
  setup() {
    return () => html`
      <h1>Home View<h1>
      <slot></slot>
    `;
  }
});
