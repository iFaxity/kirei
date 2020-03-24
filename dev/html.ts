import './html.html';

import { ref } from '@shlim/fx';
import { html, render } from '@shlim/html';
//import { html, render } from 'uhtml';
const $app = document.createElement('div');
$app.id = 'app';

document.body.appendChild($app);

function onClick() {
  alert('HELLO');
}

let count = 0;
const text = ref('Hello');
function update() {
  count++;
  render(html`
    <h1>Hello</h1>
    <p>Counter: ${count}</p>
    <input &=${text}>
    <button @click=${onClick}>Click me</button>
    <p v-show=${count % 2 == 0}>shh im sort of hidden</p>
    <p v-if=${count % 2 == 0}>shh im hidden</p>
  `, $app);
}

setInterval(update, 1000);
update();
