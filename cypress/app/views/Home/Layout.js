import { defineComponent, html } from '@kirei/element';

export default defineComponent({
  name: 'AppHome',
  setup() {
    return () => html`
      <h1>Home View<h1>
      <slot></slot>
    `;
  }
});
