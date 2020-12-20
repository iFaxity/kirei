import { defineComponent, html, css, computed } from '@kirei/element';

export default defineComponent({
  name: 'AppTextfield',
  props: {
    label: {
      type: String,
      required: true,
    },
    type: String,
    modelValue: String,
    required: Boolean,
    max: Number,
  },
  styles: css`
    :host {
      position: relative;
      min-width: 100px;
      margin: 0.3em 0;
      width: 100%;
      color: #405863;
      height: 52px;
    }
    input {
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
    }
    input:hover {
      opacity: 0.8;
    }
    input:focus {
      border-color: #c60000;
      opacity: 1;
    }
    label {
      position: absolute;
      top: -0.5em;
      left: 1em;
      opacity: 0.5;
      transition: transform 0.2s ease, opacity 0.2s ease, color 0.2s ease;
      will-change: transform, opacity, color;
      transform-origin: top left;
      pointer-events: none;
    }
    input:focus + label,
    input:not(:placeholder-shown) + label {
      color: #c60000;
      transform: translateY(-60%) scale(0.9);
      opacity: 1;
    }
  `,
  setup(props, ctx) {
    const uuid = Math.random().toString(16).slice(2);
    const model = computed({
      get: () => props.modelValue,
      set: (value) => ctx.emit('update:modelValue', value)
    })

    return () => html`
    <input &=${model} id=${uuid} type=${props.type} maxlength=${props.max || ''} required=${props.required} placeholder=" ">
    <label for=${uuid}>${props.label}</label>
    `;
  },
});
