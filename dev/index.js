import './index.html';
import { defineElement, ref, computed, html, css, onMount, onBeforeUpdate, onUpdate, onUnmount } from '@qubit/element';
import { createRouter, routerView } from '@qubit/router';
// fills an array with start to end, not including end
/*function range(start: number, end: number = null) {
  if (end == null) {
    [ start, end ] = [ 0, start ]
  } else if (start > end) {
    [ start, end ] = [ end, start ]
  }

  return Array.from(Array(end - start)).map(n => n + start);
}*/
// create router element
function create(name, text) {
    return defineElement({
        name,
        setup() {
            return () => html `<h1>${text}</h1>`;
        },
    });
}
const AppUser = defineElement({
    name: 'AppUser',
    props: {
        user: String,
    },
    setup(props) {
        return () => html `<h1>Hello ${props.user}</h1><slot></slot>`;
    },
});
const AppCalc = defineElement({
    name: 'AppCalc',
    setup() {
        const net = ref(0);
        const price = ref(0);
        const margin = computed(() => {
            if (!gross.value || !net.value)
                return 0;
            const diff = 1 - net.value / gross.value;
            return Math.round(diff * 100);
        });
        const gross = computed(() => {
            return isNaN(price.value) ? 0 : price.value / 1.25;
        });
        const grossNumber = computed(() => {
            return gross.value.toString().replace('.', ',');
        });
        return () => html `
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
        return () => html `
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
    //data: () => ({ num: 5, text: '', value: 'Try me', fruit: '', os: ['windows'], drink: 'cola', snacks: [ 'chips', 'popcorn' ] }),
    setup() {
        const name = 'AppRoot';
        const num = ref(5);
        const text = ref('');
        const value = ref('Try me');
        const fruit = ref('');
        const os = ref(['windows']);
        const drink = ref('cola');
        const snacks = ref(['chips', 'popcorn']);
        routerView();
        console.log(`created ${name}`);
        onMount(() => console.log(`mounted ${name}`));
        onBeforeUpdate(() => console.log(`updating ${name}`));
        onUpdate(() => console.log(`updated ${name}`));
        onUnmount(() => console.log(`destroyed ${name}`));
        return () => html `
      <a #=${'/calc'}>Calculator</a>
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

      <h3>Fruit</h3>
      <select &=${fruit}>
        <option disabled value="">---Choose a value---</option>
        <option value="banana">Bananas</option>
        <option value="apple">Apples</option>
        <option value="orange">Oranges</option>
      </select>

      <h3>OS</h3>
      <label>macOS</label>
      <input &=${os} type="checkbox" value="macos">
      <label>Unix</label>
      <input &=${os} type="checkbox" value="unix">
      <label>Windows</label>
      <input &=${os} type="checkbox" value="windows">

      <h3>Drink</h3>
      <label>Coffee</label>
      <input &=${drink} type="radio" value="coffee">
      <label>Cola</label>
      <input &=${drink} type="radio" value="cola">
      <label>Water</label>
      <input &=${drink} type="radio" value="water">

      <h3>Drink</h3>
      <label>Coffee</label>
      <input &=${drink} type="checkbox" value="coffee">
      <label>Cola</label>
      <input &=${drink} type="checkbox" value="cola">
      <label>Water</label>
      <input &=${drink} type="checkbox" value="water">

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
    props: {
        count: {
            type: Number,
            default: 0,
        },
        text: {
            type: String,
            default: '',
        }
    },
    model: {
        prop: 'count',
        event: 'click'
    },
    setup(props, ctx) {
        function onClick() {
            console.log('CLICK');
            props.text += props.text ? ', a' : 'a';
            props.count++;
            ctx.emit('click'); // models must be manually emitted
        }
        return () => html `
      <button @click=${onClick}>Clicked ${props.count} times</button>
      <p>${props.text}</p>
    `;
    },
    get styles() {
        return css `
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
    `;
    }
});
//# sourceMappingURL=index.js.map