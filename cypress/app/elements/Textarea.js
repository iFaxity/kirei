import { defineElement, html, css, toRef, computed } from '@kirei/element';

export default defineElement({
  name: 'AppTextarea',
  sync: {
    prop: 'value',
    event: 'input',
  },
  props: {
    id: String,
    value: String,
    required: Boolean,
    cols: Number,
    rows: Number,
    max: Number,
    label: {
      type: String,
      required: true,
    },
    valid: {
      type: Boolean,
      default: true,
    },
  },
  styles: css`
    :host {
      display: block;
      position: relative;
      margin: 0.3em 0;
      width: 100%;
      background: #e6e6e67f;
      border-radius: 0.2em;
      color: #405863;
    }
    textarea {
      background: transparent;
      font-size: 1em;
      font-family: inherit;
      margin-top: 1.5em;
      padding: 0 1em 1em;
      width: 100%;
      transition: border-color 0.2s ease, opacity 0.2s ease;
      border: none;
      border-bottom: 0.2em solid #8ea3ac;
      border-radius: 0.2em;
      outline: none;
      box-sizing: border-box;
      opacity: 0.5;
      vertical-align: top;
      resize: none;
    }
    textarea:hover {
      opacity: 0.8;
    }
    textarea:focus {
      border-color: #c60000;
      opacity: 1;
    }
    label {
      position: absolute;
      top: 1em;
      left: 1em;
      opacity: 0.5;
      transition: transform 0.2s ease, opacity 0.2s ease, color 0.2s ease;
      will-change: transform, opacity, color;
      transform-origin: top left;
      pointer-events: none;
    }
    .count {
      position: absolute;
      top: 1em;
      right: 1em;
      opacity: 0.5;
      pointer-events: none;
      transform-origin: top right;
      transition: transform 0.2s ease;
    }
    textarea:focus + label,
    textarea:valid + label {
      color: #c60000;
      transform: translateY(-60%) scale(0.9);
      opacity: 1;
    }
    textarea:focus ~ .count,
    textarea:valid ~ .count {
      transform: translateY(-60%) scale(0.9);
    }
    ::-webkit-scrollbar {
      border-radius: 0.3em;
      width: 0.6em;
      background-color: transparent;
      cursor: default;
    }
    ::-webkit-scrollbar-track {
      -webkit-box-shadow: inset 0 0 2px rgba(0,0,0,0.3);
      border-radius: 0.3em;
      background-color: transparent;
    }
    ::-webkit-scrollbar-thumb {
      border-radius: 0.3em;
      -webkit-box-shadow: inset 0 0 6px rgba(0,0,0,.3);
      background-color: #555;
      cursor: pointer;
    }
    ::-webkit-scrollbar-thumb:hover {
      background-color: #777;
    }
    ::-webkit-scrollbar-thumb:active {
      background-color: #b70000;
    }
  `,
  setup(props) {
    const uuid = Math.random().toString(16).slice(2);
    const sync = toRef(props, 'value');
    const charCount = computed(() => {
      if (props.max) {
        return html`<span class="count">${props.value?.length ?? 0} / ${props.max}</span>`;
      }
    });

    return () => html`
    <textarea id=${uuid} &.lazy=${sync}
      class=${props.valid ? '': 'invalid'} maxlength=${props.max}
      cols=${props.cols} rows=${props.rows} required=${props.required}>
    </textarea>
    <label for=${uuid}>${props.label}</label>
    ${charCount}
    `;
  }
});
