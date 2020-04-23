import './calc.html';
import {
  html, css, defineElement, computed, ref, onMount
} from '@kirei/element';

export default defineElement({
  name: 'AppCalc',
  setup() {
    const price = ref(0);
    const net = ref(0);
    const el = ref<Element>(null);

    const gross = computed(() => !isNaN(price.value) && price.value / 1.25);
    const margin = computed(() => {
      const diff = 1 - net.value / gross.value;
      return isNaN(diff) ? 0 : Math.round(diff * 100);
    });
    const grossNumber = computed(() => {
      return gross.value.toString();
    });

    onMount(() => {
      console.log('MOUNTED');
      // @ts-ignore
      window.el = el.value;
    });

    return () => html`
      <h1>Priskalkyleraren</h1>

      <label for="price">Cirkapris</label>
      <input id="price" &.number=${price}>
      <label for="net">Inköpspris</label>
      <input ref=${el} id="net" &.number=${net}>

      <p v-if=${gross}>Bruttopris: ${grossNumber}</p>
      <p v-if=${margin}>Marginal: ${margin}%</p>
    `;
  },

  styles: css`
    label {
      color: red;
    }
  `,
});
