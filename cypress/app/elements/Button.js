import { defineElement, html, css } from '@kirei/element';

export default defineElement({
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
