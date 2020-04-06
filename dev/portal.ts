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
    const count = ref(0);
    const show = ref(false);

    function addItem() {
      Math.random();
      items.push({ text: text.value, id: generateId(), });
      text.value = '';
    }

    function increment() {
      count.value++;
      show.value = true;
    }

    function closePortal() {
      show.value = false;
    }

    portal('#portal', () => html`
      <div if=${show} @click.self=${closePortal} style="
        position: fixed;
        top: 0;
        right: 0;
        left: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        z-index: 10;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="width: 80%; box-sizing: border-box; padding: 3em 5em; background: #fff;">
          <h2>Portal</h2>
          <p>Text: ${text}</p>
          <h3>List</h3>
          <ol>${html.for(items, item => item.id, item => html`<li>${item.text}</li>`)}</ol>
          <button @click=${closePortal}>Close</button>
        </div>
      </div>
    `);

    return () => html`
      <h1>Portal Test</h1>
      <input &=${text} type="text" @keyup.enter=${addItem}>
      <p>Counter ${count}</p>
      <button @click=${increment}>Increment</button>
    `;
  },
});
