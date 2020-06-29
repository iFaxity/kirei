/// <reference types="cypress" />

import { watchEffect, ref } from '@kirei/fx';

describe('@kirei/fx/watch', () => {
  describe('#watchEffect', () => {
    it('runs when dependency updates', () => {
      const count = ref(0);
      let res = null;
      watchEffect(() => { res = count.value; });

      count.value += 1;
      assert.equal(res, 1);
      count.value = 10;
      assert.equal(res, 10);
    });

    it('stop when calling returning function', () => {
      const name = ref('Nina');
      let res = null;
      const stop = watchEffect(() => { res = name.value; });

      name.value = 'Dan';
      assert.equal(res, 'Dan');
      stop();
      name.value = 'Avi';
      assert.equal(res, 'Dan');
    });

    it('with object as target', () => {
      assert.throws(() => watchEffect({}));
    });
    it('with number as target', () => {
      assert.throws(() => watchEffect(100));
    });
    it('with undefined as target', () => {
      assert.throws(() => watchEffect());
    });
  });
});
