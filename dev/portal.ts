import './portal.html';
import {
  html, defineElement, ref, reactive,
  portal
} from '@shlim/element';

function generateId() {
  return Math.random().toString(16).slice(2);
}

export default defineElement({
  name: 'AppRoot',
  setup() {
    const text = ref('');
    const items = reactive([]);

    function onClick() {
      Math.random();
      items.push({ text: text.value, id: generateId(), });
      text.value = '';
    }

    html.portal('#portal', () => html`
      <h2>Portal</h2>
      <p>Text: ${text}</p>
      <h3>List</h3>
      <ol>${html.for(items, item => item.id, item => html`<li>${item.text}</li>`)}</ol>
    `);

    return () => html`
      <h1>Portal Test</h1>
      <input &=${text} type="text">
      <button @click=${onClick}>Append</button>
    `;
  },
});
