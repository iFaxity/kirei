import './index.html';
import './calc.html';
import { html, css, defineElement, computed, ref } from '@ifaxity/lit-fx';
export default defineElement({
    name: 'AppCalc',
    setup() {
        const price = ref(0);
        const net = ref(0);
        const gross = computed(() => !isNaN(price.value) && price.value / 1.25);
        const margin = computed(() => {
            const diff = 1 - net.value / gross.value;
            return isNaN(diff) ? 0 : Math.round(diff * 100);
        });
        const grossNumber = computed(() => {
            return gross.value.toString();
        });
        return () => html `
      <h1>Priskalkyleraren</h1>

      <label for="price">Cirkapris</label>
      <input id="price" &.number=${price}>
      <label for="net">Inköpspris</label>
      <input id="net" &.number=${net}>

      <p !=${gross}>Bruttopris: ${grossNumber}</p>
      <p !=${margin}>Marginal: ${margin}%</p>
      <p !not=${margin}>Type to show please!</p>
    `;
    },
    styles: css `
    label {
      color: red;
    }
  `,
});
//# sourceMappingURL=calc.js.map