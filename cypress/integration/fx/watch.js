/// <reference types="cypress" />
import { watchEffect, watch, ref, reactive } from '@kirei/fx';

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

    it('call stophandle', () => {
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

    it('with object', () => {
      assert.throws(() => watchEffect({}));
    });
    it('with number', () => {
      assert.throws(() => watchEffect(100));
    });
    it('with undefined', () => {
      assert.throws(() => watchEffect());
    });
  });

  describe('#watch()', () => {
    it('run on dependency update', async () => {
      let res = null;
      const count = ref(3);
      watch(count, (value, oldValue) => {
        assert.equal(value, 10);
        assert.equal(oldValue, 3);
        res = value;
      });

      assert.isNull(res);
      assert.equal(count.value, 3);
      count.value = 10;
      assert.equal(res, 10);
    });
    it('call stophandle', () => {
      let res = null;
      const active = ref(false);
      const stop = watch(active, (value, oldValue) => {
        assert.isTrue(value);
        assert.isFalse(oldValue);
        res = value;
      });

      assert.isNull(res);
      active.value = true;
      assert.isTrue(res);

      stop();
      active.value = false;
      assert.isTrue(res);
    });
    it('immediate trigger', () => {
      const text = ref('');
      watch(text, (value, oldValue) => {
        assert.equal(value, '');
        assert.isUndefined(oldValue);
      }, { immediate: true });
    });

    it('with object', () => {
      assert.throws(() => watch({}, () => assert.fail()));
    });
    it('with number', () => {
      assert.throws(() => watch(200, () => assert.fail()));
    });
    it('without callback', () => {
      assert.throws(() => watch(ref('hi')));
    });

    describe('with function', () => {
      it('with ref', () => {
        const r = ref(true);
        watch(() => r.value, (value, oldValue) => {
          assert.isNull(value);
          assert.isTrue(oldValue);
        });

        r.value = null;
      });
      it('with reactive', () => {
        let res;
        const r = reactive({ foo: 'bar' });
        watch(() => r.foo, (value, oldValue) => {
          assert.equal(oldValue, 'bar');
          assert.equal(value, 'baz');
          res = value;
        });

        r.foo = 'baz';
        assert.equal(res, 'baz');
      });
      it('with object', () => {
        let res;
        const r = { foo: 'bar' };
        watch(() => r.foo, (value) => {
          res = value;
        });

        r.foo = 'baz';
        assert.isUndefined(res);
      });
    });

    describe('with array', () => {
      it('ref', () => {
        const bool = ref(false);
        const num = ref(5);
        watch([ bool, num ], ([ boolValue, numValue ], [ oldBoolValue, oldNumValue ]) => {
          assert.isTrue(boolValue);
          assert.isFalse(oldBoolValue);
          assert.equal(numValue, oldNumValue);
        });

        bool.value = true;
      });
      it('reactive', () => {
        const r = reactive({ name: 'Kirei' });
        assert.throws(() => watch(r, () => assert.fail('')));
      });
      it('object', () => {
        const o = { foo: 'bar' };
        assert.throws(() => watch(o, () => assert.fail('')));
      });

      describe('with function', () => {
        it('ref', () => {
          
        });
        it('reactive', () => {});
        it('object', () => {});
      });
    });
  });
});
