import { defineComponent, html, css, computed } from '@kirei/element';

export default defineComponent({
  name: 'AppRadio',
  props: {
    modelValue: [Boolean, String],
    value: String,
    label: String,
  },
  styles: css`
    :host {
      margin: .5em 0;
      height: 1.25em;
    }
    label {
      position: relative;
      padding-left: 1.8em;
      cursor: pointer;
      user-select: none;
    }
    .check {
      position: absolute;
      top: 0.05em;
      left: 0;
      height: 1em;
      width: 1em;
      border-radius: 50%;
      border: 2px solid #bbb;
      opacity: 0.5;
      transition: all 0.3s ease;
    }
    label:hover .check {
      opacity: 1;
    }
    .check::after {
      content: '';
      position: absolute;
      background: #c60000;
      border-radius: 50%;
      transition: all 0.3s ease;
      /*top: 0.1875em;
      left: 0.1875em;
      width: 0.625em;
      height: 0.625em;*/
      top: 0.25em;
      left: 0.25em;
      width: 0.5em;
      height: 0.5em;
      transform: scale(0);
    }
    input:checked + .check {
      border-color: #c60000;
      opacity: 1;
    }
    input:checked + .check::after {
      transform: scale(1);
    }
    input {
      display: none;
    }
  `,
  setup(props, ctx) {
    const uuid = Math.random().toString(16).slice(2);
    const model = computed({
      get: () => props.modelValue,
      set: (value) => ctx.emit('update:modelValue', value),
    });

    return () => html`
    <label for=${uuid}>
      ${props.label || ''}
      <input type="radio" id=${uuid} value=${props.value} &=${model}>
      <span class="check"></span>
    </label>
    `;
  },
});
