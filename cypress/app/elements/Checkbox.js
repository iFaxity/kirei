import { defineElement, html, css, toRef } from '@kirei/element';

export default defineElement({
  name: 'AppCheckbox',
  sync: 'checked',
  props: {
    checked: [Boolean, String],
    value: String,
    label: {
      type: String,
      required: true,
    },
  },
  styles: css`
    :host {
      margin: .5em 0;
    }
    :host([required]) > label:after {
      content: '*';
      color: #d00;
      margin-left: 0.2em;
    }
  `,
  setup(props) {
    const uuid = Math.random().toString(16).slice(2);
    const sync = toRef(props, 'checked');

    return () => html`
    <label for=${uuid}>${props.label}</label>
    <input type="checkbox" &=${sync} id=${uuid} value=${props.value}>
    `;
  },
});
