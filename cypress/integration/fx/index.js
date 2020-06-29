/// <reference types="cypress" />
import { toRef, toRefs, toRawValue, isRef, ref, reactive, readonly } from '@kirei/fx';

describe('@kirei/fx/index', () => {
  describe('#toRawValue', () => {
    it('with ref', () => {
      const r = ref('reffy');
      assert.equal(toRawValue(r), 'reffy');
    });
    it('with reactive', () => {
      const o = {};
      const r = reactive(o);
      assert.equal(toRawValue(r), o);
    });
    it('with object', () => {
      const o = {};
      assert.equal(toRawValue(o), o);
    });
    it('with number', () => {
      assert.equal(toRawValue(43), 43);
    });
    it('with null', () => {
      assert.equal(toRawValue(null), null);
    });
  });

  describe('#toRef', () => {
    it('with reactive', () => {
      const r = reactive({ greeting: 'Hello Matt', enabled: true, count: 100 });
      const greeting = toRef(r, 'greeting');

      // Test getter
      assert.equal(greeting.value, 'Hello Matt');
      assert.equal(greeting.value, r.greeting);

      // Test setter
      greeting.value = 'Hello Kate';
      assert.equal(greeting.value, 'Hello Kate');
      assert.equal(greeting.value, r.greeting);
    });
    it('with readonly', () => {
      const r = readonly({ greeting: 'Hello Matt', enabled: true, count: 100 });
      const count = toRef(r, 'count');

      // Test getter
      assert.equal(count.value, 100);
      assert.equal(count.value, r.count);
    });
    it('with ref', () => {
      const r = ref('123');
      assert.throws(() => toRef(r, 'value'));
    });
    it('with plain object', () => {
      const o = { abc: 'def' };
      assert.throws(() => toRef(o, 'abc'));
    });
  });

  describe('#toRefs', () => {
    it('with reactive', () => {
      const r = reactive({ greeting: 'Hello Matt', enabled: true, count: 100 });
      const refs = toRefs(r);
      const keys = Object.keys(refs);

      assert.deepEqual(keys, ['greeting', 'enabled', 'count']);
      for (const key of keys) {
        // test getter
        assert(isRef(refs[key]));
        const value = refs[key].value;
        assert.equal(value, r[key]);

        // test setter
        refs[key].value += '!';
        assert.equal(refs[key].value, value + '!');
        assert.equal(refs[key].value, r[key]);
      }
    });
    it('with readonly', () => {
      const r = readonly({ greeting: 'Hello Matt', enabled: true, count: 100 });
      const refs = toRefs(r);
      const keys = Object.keys(refs);

      assert.deepEqual(keys, ['greeting', 'enabled', 'count']);
      for (const key of keys) {
        // test getter
        assert(isRef(refs[key]));
        const value = refs[key].value;
        assert.equal(value, r[key]);
      }
    });
    it('with plain object', () => {
      const o = { abc: 'def', foo: 'bar', baz: 'fooz' };
      assert.throws(() => toRefs(o));
    });
    it('with Proxy', () => {
      const p = new Proxy({ abc: 'def', foo: 'bar', baz: 'fooz' }, {});
      assert.throws(() => toRefs(p));
    });
  });
})
