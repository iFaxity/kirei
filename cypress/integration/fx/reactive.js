/// <reference types="cypress" />
import { reactive, readonly, toReactive, isReactive, toRaw } from '@kirei/fx';

describe('@ifaxity/fx/reactive', () => {
  describe('#isReactive()', () => {
    it('with reactive', () => {
      const r = reactive({});
      assert(isReactive(r));
    });
    it('with Proxy', () => {
      assert(!isReactive(new Proxy({}, {})))
    });
    it('with object', () => assert(!isReactive({})));
    it('with null', () => assert(!isReactive(null)));
    it('with undefined', () => assert(!isReactive()));
  });

  describe('#toReactive()', () => {
    it('with reactive', () => {
      const r = reactive({});
      assert.equal(toReactive(r), r);
    });
    it('with object', () => assert(isReactive(toReactive({}))));
    it('with null', () => assert.equal(toReactive(null), null));
    it('with undefined', () => assert.equal(toReactive(), undefined));
    it('with primitive', () => assert.equal(toReactive(10), 10));
  });

  describe('#toRaw()', () => {
    it('with reactive', () => {
      const o = {};
      const r = reactive(o);
      assert.equal(toRaw(r), o)
    });
    it('with Proxy', () => {
      const p = new Proxy({}, {});
      assert.equal(toRaw(p), p)
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
      assert(isReactive(readonly({})));
    });
    it('with array', () => {
      assert(isReactive(readonly([])));
    });
    it('with collection', () => {
      assert(isReactive(readonly(new Map())));
      assert(isReactive(readonly(new Set())));
      assert(isReactive(readonly(new WeakMap())));
      assert(isReactive(readonly(new WeakSet())));
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
