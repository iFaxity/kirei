import './portal.html';
import {
  html, defineElement
} from '@shlim/element';

export default defineElement({
  name: 'AppRoot',
  setup() {
    return () => html`
      <h1>Portal Test</h1>

      <div>${html.portal('#portal', html`
        <h2>Hello</h2>
      `)}</div>
    `;
  },
});
