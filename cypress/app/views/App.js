import {
  defineElement, ref, html, css,
  onMount, onBeforeUpdate, onUpdate, onUnmount,
  provide, inject, watch
} from '@kirei/element';
import { useStore } from '../store/Auth';

import '../elements/Checkbox.js';
import '../elements/Radio.js';
import '../elements/Select.js';
import '../elements/Textarea.js';
import '../elements/Textfield.js';

export const Button = defineElement({
  name: 'AppButton',
  sync: 'count',
  props: {
    /*count: {
      type: Number,
      default: 0,
    },*/
    text: {
      type: String,
      default: '',
    },
  },
  setup(props, ctx) {
    const Store = inject('store');
    onUpdate(() => console.log('Updating AppButton'));

    function onClick() {
      console.log('CLICK');
      Store.increment();
      ctx.emit('update:text', props.text += props.text ? ', a' : 'a');
    }

    return () => html`
      <button @click=${onClick}>Clicked ${Store.count} times</button>
      <p>${props.text}</p>
    `;
  },
  styles: css`
    button {
      background: #1E88E5;
      color: white;
      padding: 0.8rem 1.2rem;
      border: 0;
      font-size: 1rem;
      cursor: pointer;
      outline: none;
      border: 1px solid #1E88E5;
      border-radius: 0.1em;
      transition: box-shadow 0.2s ease;
      min-width: 64px;
    }

    button:hover {
      box-shadow: 0 0.6em 0.6em rgba(0,0,0,0.2);
    }
  `,
});

// app root view
export default defineElement({
  name: 'AppRoot',
  props: {
    count: {
      type: [Number, String],
      default: 5,
    },
  },
  styles: css`
    input[type="checkbox"]:checked + label {
      color: red;
    }

    .link-active {
      color: red;
    }

    .link-exact {
      color: purple;
    }
  `,

  setup(props) {
    const name = 'AppRoot';
    //const count = ref(props.count);
    const text = ref('');
    const value = ref('Try me');
    const fruit = ref('apple');
    const os = ref(['windows']);
    const drink = ref('cola');
    const snacks = ref([ 'chips', 'popcorn' ]);
    const fruits = [
      [ 'Bananas', 'banana' ],
      [ 'Oranges', 'orange' ],
      [ 'Apples', 'apple' ],
    ];

    const Store = useStore();
    Store.count.value = props.count;
    provide('store', Store);
    provide('text', value);

    watch([ value, fruit ], (value, oldValue) => {
      if (Array.isArray(value)) {
        for (let i = 0; i < value.length; i++) {
          console.log(`${i}: ${oldValue[i]} updated to ${value[i]}`);
        }
      } else {
        console.log(`${oldValue} updated to ${value}`);
      }
    }, { immediate: true });

    const links = [
      { link: '/', text: 'Welcome page' },
      { link: '/home', text: 'Home' },
      { link: '/home/news', text: 'News' },
      { link: '/user', text: 'Users view' },
      { link: '/user/test', text: 'Test user view' },
      { link: '/clock', text: 'Clock' }
    ];

    console.log(`created ${name}`);
    onMount(() => console.log(`mounted ${name}`));
    onBeforeUpdate(() => console.log(`updating ${name}`));
    onUpdate(() => console.log(`updated ${name}`));
    onUnmount(() => console.log(`destroyed ${name}`));

    return () => html`
      <ul>
      ${links.map(item => html.key(item, html`
        <li>
          <a link=${item.link}>${item.text}
        </li>
      `))}
      </ul>
      <p>Count: ${Store.count}</p>
      <p>Hello, ${name}!</p>
      <p>Text: ${text}</p>
      <app-button &text=${text}></app-button>
      <hr>

      <p>Text: ${value}</p>
      <p>Fruit: ${fruit}</p>
      <p>OS: ${os.value.join(', ')}</p>
      <p>Drink: ${drink}</p>
      <p>Snacks: ${snacks.value.join(', ')}</p>

      <h3>Text</h3>
      <input &=${value} placeholder="Textbox">

      <h3>Lazy text</h3>
      <app-textarea &=${value}></app-textarea>

      <h3>Fruit</h3>
      <select &=${fruit}>
        <option disabled value="">---Choose a value---</option>
        ${fruits.map(item => html.key(item, html`
          <option value=${item[1]}>${item[0]}</option>
        `))}
      </select>

      <h1>OS</h1>
      <app-checkbox &=${os} label="macOS" value="macos"></app-checkbox>
      <app-checkbox &=${os} label="Unix" value="unix"></app-checkbox>
      <app-checkbox &=${os} label="Windows" value="windows"></app-checkbox>

      <h3>Drink</h3>
      <app-radio &=${drink} label="Coffee" value="coffee"></app-radio>
      <app-radio &=${drink} label="Cola" value="cola"></app-radio>
      <app-radio &=${drink} label="Water" value="water"></app-radio>

      <h3>Drinks</h3>
      <app-checkbox &=${drink} label="Coffee" value="coffee"></app-checkbox>
      <app-checkbox &=${drink} label="Cola" value="cola"></app-checkbox>
      <app-checkbox &=${drink} label="Water" value="water"></app-checkbox>

      <h3>Snacks</h3>
      <select &=${snacks} multiple>
        <option disabled value="">---Choose a value---</option>
        <option value="chips">Chips</option>
        <option value="nuts">Nuts</option>
        <option value="popcorn">Popcorn</option>
      </select>

      <hr>
      <slot></slot>
    `;
  },
});
