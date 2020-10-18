import { defineElement, html, css, computed } from '@kirei/element';

export default defineElement({
  name: 'AppCheckbox',
  props: {
    modelValue: [Boolean, String, Array],
    value: String,
    label: {
      type: String,
      required: true,
    },
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
      border: 0.1em solid #bbb;
      fill: none;
      opacity: 0.5;
      transition: all 0.3s ease;
      transform: scale(0);
    }
    label:hover .check {
      opacity: 1;
    }
    input:checked + .check {
      fill: #c60000;
      stroke-width: 0.1em;
      stroke: #c60000;
      border-color: #c60000;
      opacity: 1;
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
      set: (value) => ctx.emit('update:modelValue', value)
    })

    return () => html`
    <label for=${uuid}>
      ${props.label || ''}
      <input type="checkbox" &=${model} value=${props.value} id=${uuid}>

      <svg class="check" viewBox="0 0 20 20">
        <path class="checkmark" d="M7.629,14.566c0.125,0.125,0.291,0.188,0.456,0.188c0.164,0,0.329-0.062,0.456-0.188l8.219-8.221c0.252-0.252,0.252-0.659,0-0.911c-0.252-0.252-0.659-0.252-0.911,0l-7.764,7.763L4.152,9.267c-0.252-0.251-0.66-0.251-0.911,0c-0.252,0.252-0.252,0.66,0,0.911L7.629,14.566z" />
      </svg>
    </label>
    `;
  },
});
