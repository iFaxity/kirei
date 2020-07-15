/// <reference types="cypress" />
import { isRef, unRef, ref, createRef } from '@kirei/fx/dist/ref';
import { isReactive } from '@kirei/fx';

describe('fx/ref', () => {
  describe('#ref()', () => {
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

    it('with another ref as argument', () => {
      const r = ref({});
      const e = ref(r);

      assert.equal(r, e);
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

  describe('#isRef()', () => {
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

  describe('#unRef()', () => {
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

  describe('#createRef()', () => {
    it('getter', () => {
      const r = createRef({
        get: () => 'hello',
      });

      assert.equal(r.value, 'hello');
      assert.throws(() => { r.value += 'world'; });
    });

    it('getter and setter', () => {
      let value = 123;
      const r = createRef({
        get: () => value,
        set: (v) => { value = v; },
      });

      assert.equal(r.value, 123);
      r.value = 5;
      assert.equal(r.value, 5);
    });
    it('invalid getter', () => {
      assert.throws(() => createRef({ get: null }));
      assert.throws(() => createRef({ get: 100 }));
      assert.throws(() => createRef({}));
    });
    it('invalid setter', () => {
      const get = () => {}; // no-op
      assert.throws(() => createRef({ get, set: 100 }));
      assert.throws(() => createRef({ get, set: 'hello' }));
    });
  });
});
