import { defineComponent, html, css, computed } from '@kirei/element';

export default defineComponent({
  name: 'AppSelect',
  props: {
    id: String,
    modelValue: String,
    required: Boolean,
    label: {
      type: String,
      required: true,
    },
    items: {
      type: Array,
      required: true,
    },
  },
  styles: css`
    :host {
      position: relative;
      min-width: 100px;
      margin: 0.3em 0;
      width: 100%;
      height: 52px;
    }
    select {
      color: #405863;
      background: #e6e6e6;
      font-size: 1em;
      padding: 1.5em 1em 0.5em;
      width: 100%;
      transition: border-color 0.2s ease, opacity 0.2s ease;
      border: none;
      border-bottom: 0.1em solid #8ea3ac;
      border-radius: 0.2em;
      outline: none;
      box-sizing: border-box;
      opacity: 0.5;
      -webkit-appearance: none;
      cursor: pointer;
    }
    select:hover {
      opacity: 0.8;
    }
    select:focus {
      border-color: #c60000;
      opacity: 1;
    }
    label {
      color: #405863;
      position: absolute;
      top: 1em;
      left: 1em;
      opacity: 0.5;
      transition: transform 0.2s ease, opacity 0.2s ease, color 0.2s ease;
      will-change: transform, opacity, color;
      transform-origin: top left;
      pointer-events: none;
    }
    select:focus + label,
    select:valid + label {
      color: #c60000;
      transform: translateY(-60%) scale(0.9);
      opacity: 1;
    }
    select > option:first-child {
      display: none;
    }
    :host::after {
      content: '';
      position: absolute;
      top: 1.5em;
      right: 1em;
      width: 0;
      height: 0;
      border-left: 0.3em solid transparent;
      border-right: 0.3em solid transparent;
      border-top: 0.3em solid #405863;
      transition: transform .2s ease;
      pointer-events: none;
    }
  `,
  setup(props, ctx) {
    const uuid = Math.random().toString(16).slice(2);
    const model = computed({
      get: () => props.modelValue,
      set: (value) => ctx.emit('update:modelValue', value)
    })

    return () => html`
    <select &=${model} id=${uuid} required=${props.required}>
      <option></option>
      ${props.items.map(item => html`<option>${item}</option>`)}
    </select>
    <label for=${uuid}>${props.label}</label>
    `;
  }
});
