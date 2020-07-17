import {
  defineElement, ref, computed, html, css,
  onMount, onBeforeUpdate, onUpdate, onUnmount,
  provide, inject
} from '@kirei/element';
import { createRouter, routerView } from '@kirei/router';

import './elements/Checkbox';
import './elements/Radio';
import './elements/Select';
import './elements/Textarea';
import './elements/Textfield';

const injectText = Symbol();

// create router element
function create(name, title) {
  return defineElement({
    name,
    setup() {
      const text = inject(injectText);

      return () => html`
      <h1>${title}</h1>
      <input &=${text}>
      `;
    },
  });
}

const AppUser = defineElement({
  name: 'AppUser',
  props: {
    user: String,
  },
  setup(props) {
    return () => html`<h1>Hello ${props.user}</h1><slot></slot>`;
  },
});

const AppCalc = defineElement({
  name: 'AppCalc',
  setup() {
    const net = ref(0);
    const price = ref(0);

    const margin = computed(() => {
      if(!gross.value || !net.value) return 0;

      const diff = 1 - net.value / gross.value;
      return Math.round(diff * 100);
    });
    const gross = computed(() => isNaN(price.value) ? 0 : price.value / 1.25);
    const grossNumber = computed(() => gross.value.toLocaleString());

    return () => html`
      <h1>Priskalkyleraren</h1>

      <label for="price">Cirkapris</label>
      <input id="price" &.number=${price}>

      <label for="net">Inköpspris</label>
      <input id="net" &.number=${net}>

      <p>Bruttopris: ${grossNumber}</p>
      <p>Marginal ${margin}%</p>
    `;
  },
});

const AppHome = defineElement({
  name: 'AppHome',
  setup() {
    routerView();

    return () => html`
      <h1>Home View<h1>
      <slot></slot>
    `;
  }
});

// Define the router
const AppView = create('app-view', 'Welcome view');
const AppHomeView = create('app-home-view', 'Home subview');
const AppHomeNews = create('app-home-news', 'News subview');
const AppUsers = create('app-users', 'Users view');

createRouter({
  base: '',
  routes: [
    { path: '/', element: AppView },
    {
      path: '/home',
      element: AppHome,
      routes: [
        { path: '/', element: AppHomeView },
        { path: '/news', element: AppHomeNews },
      ],
    },
    { path: '/user', element: AppUsers },
    { path: '/user/:user', element: AppUser },
    { path: '/calc', element: AppCalc },
  ]
});

// router end
defineElement({
  name: 'AppRoot',
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

  setup() {
    const name = 'AppRoot';
    const num = ref(5);
    const text = ref('');
    const value = ref('Try me');
    const fruit = ref('');
    const os = ref(['windows']);
    const drink = ref('cola');
    const snacks = ref([ 'chips', 'popcorn' ]);
    const fruits = [
      [ 'Bananas', 'banana' ],
      [ 'Oranges', 'orange' ],
      [ 'Apples', 'apple' ],
    ];

    provide(injectText, value);

    const links = [
      { link: '/', text: 'Welcome page' },
      { link: '/home', text: 'Home' },
      { link: '/home/news', text: 'News' },
      { link: '/user', text: 'Users view' },
      { link: '/user/test', text: 'Test user view' },
      { link: '/calc', text: 'Calculator' },
    ];

    routerView();
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
      <p>Count: ${num}</p>
      <p>Hello, ${name}!</p>
      <p>Text: ${text}</p>
      <app-button &=${num} &text=${text}></app-button>
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

      <h3>OS</h3>
      <app-checkbox &=${os} label="macOS" value="macos"></app-checkbox>
      <app-checkbox &=${os} label="Unix" value="unix"></app-checkbox>
      <app-checkbox &=${os} label="Windows" value="windows"></app-checkbox>

      <h3>Drink</h3>
      <app-radio &=${drink} label="Coffee" value="coffee"></app-radio>
      <app-radio &=${drink} label="Cola" value="cola"></app-radio>
      <app-radio &=${drink} label="Water" value="water"></app-radio>

      <h3>Drink</h3>
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

defineElement({
  name: 'AppButton',
  sync: 'count',
  props: {
    count: {
      type: Number,
      default: 0,
    },
    text: {
      type: String,
      default: '',
    },
  },
  setup(props) {
    function onClick() {
      console.log('CLICK');
      props.text += props.text ? ', a' : 'a';
      props.count++;
    }

    return () => html`
      <button @click=${onClick}>Clicked ${props.count} times</button>
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
