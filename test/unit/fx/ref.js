const { isRef, unRef, ref, isReactive } = require('../../../packages/fx/dist');
const { strict: assert } = require('assert');

describe('@kirei/fx', () => {
  describe('ref', () => {
    it('get/set primitive', () => {
      const r = ref(1);
      assert.equal(r.value, 1);
      r.value = 2;
      assert.equal(r.value, 2);
    });

    it('get/set object', () => {
      const o = {};
      const r = ref(o);

      assert(isReactive(r.value));
      assert.notEqual(r.value, o);
      assert.notEqual(r.value, r);

      r.value = 'ok';
      assert.equal(r.value, 'ok');
    });

    it('toString', () => {
      const r = ref(3);
      // Implicit and explicit
      assert.equal(r.toString(), '3');
      assert.equal('' + r, '3');
    });

    it('valueOf', () => {
      const r = ref(4);
      // Implicit and explicit
      assert.equal(r.valueOf(), 4);
      assert.equal(+r, 4);
    });
  });

  describe('isRef', () => {
    it('with ref argument', () => {
      const r = ref();
      assert(isRef(r));
    });
    it('with object argument', () => assert(!isRef({})));
    it('with null argument', () => assert(!isRef(null)));
    it('with number', () => assert(!isRef(100)));
    it('with ref alike argument', () => {
      const r = {
        get value() { return 'hello' },
        set value(_) {},
      };
      assert(!isRef(r));
    });
  });

  describe('unRef', () => {
    it('with ref argument', () => {
      const r = ref('hello');
      assert.equal(unRef(r), 'hello');
    });

    it('with ref object argument', () => {
      const o = {};
      const r = ref(o);
      const res = unRef(r);

      assert(isReactive(res));
      assert.notEqual(res, r);
      assert.notEqual(res, o);
    });

    it('with string argument', () => {
      const r = ref('hello');
      assert.equal(unRef(r), 'hello');
    });

    it('with number argument', () => {
      assert.equal(unRef(20), 20);
    });

    it('with null argument', () => {
      assert.equal(unRef(null), null);
    });

    it('with undefined argument', () => {
      assert.equal(unRef(), undefined);
    });
  });
})
