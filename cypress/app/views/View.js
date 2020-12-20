import { defineComponent, html, inject } from '@kirei/element';

export default defineComponent({
  name: 'AppView',
  setup() {
    const text = inject('text');

    return () => html`
    <h1>Welcome View</h1>
    <input &=${text}>
    `;
  },
});
