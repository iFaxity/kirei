/// <reference types="cypress" />
import { watchEffect, ref } from '@kirei/fx';

describe('watch', () => {
  describe('#watchEffect()', () => {
    it('runs when dependency updates', () => {
      let res = null;
      const count = ref(0);
      watchEffect(() => { res = count.value; });

      assert.equal(res, 0);
      count.value += 1;
      assert.equal(res, 1);
      count.value = 10;
      assert.equal(res, 10);
    });

    it('stop when calling returning function', () => {
      let res = null;
      const name = ref('Nina');
      const stop = watchEffect(() => { res = name.value; });

      assert.equal(res, 'Nina');
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
