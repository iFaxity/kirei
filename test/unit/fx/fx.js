const { Fx, fxStack, activeFx } = require('../../../packages/fx/dist/fx');
const { strict: assert } = require('assert');

describe('@kirei/fx', () => {
  describe('Fx', () => {
    it('constructor', () => {
      
    });
    it('get/set primitive', () => {
      const r = ref(1);
      assert.equal(r.value, 1);

      r.value = 2;
      assert.equal(r.value, 2);
    });
  });
})
