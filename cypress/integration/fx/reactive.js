/// <reference types="cypress" />
import { reactive, readonly, toReactive, toReadonly, isReactive, isReadonly, isObserver, toRaw } from '@kirei/fx';

describe('fx/reactive', () => {
  describe('#isObserver()', () => {
    it('with reactive', () => {
      const r = reactive({});
      assert(isReactive(r));
    });
    it('with Proxy', () => {
      assert(!isReactive(new Proxy({}, {})));
    });
    it('with object', () => assert(!isReactive({})));
    it('with null', () => assert(!isReactive(null)));
    it('with undefined', () => assert(!isReactive()));
  });

  describe('#isReactive()', () => {
    it('with reactive', () => {
      const r = reactive({});
      assert(isReactive(r));
    });
    it('with Proxy', () => {
      assert(!isReactive(new Proxy({}, {})));
    });
    it('with object', () => assert(!isReactive({})));
    it('with null', () => assert(!isReactive(null)));
    it('with undefined', () => assert(!isReactive()));
  });

  describe('#isReadonly()', () => {
    it('with reactive', () => {
      const r = readonly({});
      assert(isReadonly(r));
    });
    it('with Proxy', () => assert(!isReadonly(new Proxy({}, {}))));
    it('with object', () => assert(!isReadonly({})));
    it('with null', () => assert(!isReadonly(null)));
    it('with undefined', () => assert(!isReadonly()));
  });

  describe('#toReactive()', () => {
    it('with reactive', () => {
      const r = reactive({});
      assert.equal(toReactive(r), r);
    });
    it('with readonly', () => {
      const r = readonly({});
      assert.notEqual(toReactive(r), r);
    });
    it('with object', () => assert(isReactive(toReactive({}))));
    it('with null', () => assert.equal(toReactive(null), null));
    it('with undefined', () => assert.equal(toReactive(), undefined));
    it('with primitive', () => assert.equal(toReactive(10), 10));
  });

  describe('#toReadonly()', () => {
    it('with readonly', () => {
      const r = readonly({});
      assert.equal(toReadonly(r), r);
    });
    it('with reactive', () => {
      const r = reactive({});
      assert.notEqual(toReadonly(r), r);
    });
    it('with object', () => assert(isReadonly(toReadonly({}))));
    it('with null', () => assert.equal(toReadonly(null), null));
    it('with undefined', () => assert.equal(toReadonly(), undefined));
    it('with primitive', () => assert.equal(toReadonly(10), 10));
  });

  describe('#toRaw()', () => {
    it('with reactive', () => {
      const o = {};
      const r = reactive(o);
      assert.equal(toRaw(r), o);
    });
    it('with readonly', () => {
      const o = {};
      const r = readonly(o);
      assert.equal(toRaw(r), o);
    });
    it('with Proxy', () => {
      const p = new Proxy({}, {});
      assert.equal(toRaw(p), p);
    });
    it('with primitive', () => {
      assert.equal(toRaw('hi'), 'hi');
    });
    it('with null', () => {
      assert.equal(toRaw(null), null);
    });
    it('with undefined', () => {
      assert.equal(toRaw(), undefined);
    });
  });

  describe('#reactive()', () => {
    it('with object', () => {
      assert(isReactive(reactive({})));
    });
    it('with array', () => {
      assert(isReactive(reactive([])));
    });
    it('with collection', () => {
      assert(isReactive(reactive(new Map())));
      assert(isReactive(reactive(new Set())));
      assert(isReactive(reactive(new WeakMap())));
      assert(isReactive(reactive(new WeakSet())));
    });
    it('prevent reactive cloning', () => {
      const r = reactive({});
      assert.equal(r, reactive(r));
    });
    it('with primitives', () => {
      assert.throws(() => reactive('hi'));
      assert.throws(() => reactive(100));
      assert.throws(() => reactive(false));
      assert.throws(() => reactive(Symbol()));
    });
  });

  // only test read and writes on some props
  describe('#readonly()', () => {
    it('with object', () => {
      assert(isReadonly(readonly({})));
    });
    it('with array', () => {
      assert(isReadonly(readonly([])));
    });
    it('with collection', () => {
      assert(isReadonly(readonly(new Map())));
      assert(isReadonly(readonly(new Set())));
      assert(isReadonly(readonly(new WeakMap())));
      assert(isReadonly(readonly(new WeakSet())));
    });
    it('prevent reactive cloning', () => {
      const r = readonly({});
      assert.equal(r, readonly(r));
    });
    it('with primitives', () => {
      assert.throws(() => readonly('hi'));
      assert.throws(() => readonly(100));
      assert.throws(() => readonly(false));
      assert.throws(() => readonly(Symbol()));
    });
  });
})
