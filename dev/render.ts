import './render.html';

import { html, render } from '@kirei/html';
//import { html, render } from 'uhtml';
const $app = document.createElement('div');
$app.id = 'app';

document.body.appendChild($app);

// element
let count = 0;
let text = 'hello';
const items = [];

function onClick() {
  items.push({ id: ++count });
  update();
}

function onInput(e) {
  text = e.target.value;
  update();
}

function update() {
  render(html`
    <h1>Hello</h1>
    <p>Counter: ${count}</p>
    <input value=${text} @input=${onInput}>
    <p>${text}</p>
    <button @click=${onClick}>Click me</button>
    <p not=${count % 2 == 0}>shh im sort of hidden</p>
    <p if=${count % 2 == 0}>shh im hidden</p>

    <ul>
      ${items.map(item => html.key(item, item.id, html`<li>${item}</li>`))}
    </ul>
  `, $app);
}

update();
