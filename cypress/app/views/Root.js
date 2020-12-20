import {
  defineComponent, ref, html, css,
  onMount, onBeforeUpdate, onUpdate, onUnmount,
  provide, inject, watch
} from '@kirei/element';
import { useStore } from '../store/Auth';

import '../elements/Checkbox.js';
import '../elements/Radio.js';
import '../elements/Select.js';
import '../elements/Textarea.js';
import '../elements/Textfield.js';

export const Button = defineComponent({
  name: 'AppButton',
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
    onUpdate(() => console.debug('Updating AppButton'));

    function onClick() {
      console.debug('CLICK');
      Store.increment();
      ctx.emit('update:text', props.text + (props.text ? ', a' : 'a'));
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
export default defineComponent({
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

  directives: {
    focus: {
      beforeMount(el, binding) { console.debug('BEFORE_MOUNT'); console.debug(binding); },
      mounted(el, binding) { console.debug('MOUNTED'); console.debug(binding); },
      beforeUpdate(el, binding) { console.debug('BEFORE_UPDATE'); console.debug(binding); },
      updated(el, binding) { console.debug('UPDATED'); console.debug(binding); },
      beforeUnmount(el, binding) { console.debug('BEFORE_UNMOUNT'); console.debug(binding); },
      unmounted(el, binding) { console.debug('UNMOUNTED'); console.debug(binding); },
    }
  },

  setup(props) {
    const links = [
      { link: '/', text: 'Welcome page' },
      { link: '/home', text: 'Home' },
      { link: '/home/news', text: 'News' },
      { link: '/user', text: 'Users view' },
      { link: '/user/test', text: 'Test user view' },
      { link: '/clock', text: 'Clock' },
      { link: '/todo', text: 'Todo' },
    ];

    return () => html`
      <ul>
      ${links.map(item => html.key(item, html`
        <li>
          <a href=${item.link}>${item.text}</a>
        </li>
      `))}
      </ul>

      <slot></slot>
    `;
  },
});
