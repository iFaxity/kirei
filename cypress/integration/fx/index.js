/// <reference types="cypress" />
import { toRef, toRefs, toRawValue, isRef, ref, reactive, readonly } from '@kirei/fx';

function assertRef(actual, expected) {
  assert(isRef(actual));
  assert.equal(actual.value, expected);
}

function assertRefs(actual) {
  const refs = toRefs(actual);
  Object.keys(actual).forEach(key => assertRef(refs[key], actual[key]));
}

describe('fx/index', () => {
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
      assertRef(greeting, 'Hello Matt');

      // Test setter
      greeting.value = 'Hello Kate';
      assert.equal(greeting.value, 'Hello Kate');
      assert.equal(greeting.value, r.greeting);
    });
    it('with readonly', () => {
      const r = readonly({ greeting: 'Hello Matt', enabled: true, count: 100 });
      assertRef(toRef(r, 'count'), 100);
    });
    it('with ref', () => {
      const r = ref('123');
      assertRef(toRef(r, 'value'), '123');
    });
    it('with plain object', () => {
      const o = { abc: 'def' };
      assertRef(toRef(o, 'abc'), 'def');
    });
    it('with number', () => {
      assert.throws(() => assertRef(100, 100));
    });
    it('with null', () => {
      assert.throws(() => assertRef(null, null));
    });
  });

  describe('#toRefs', () => {
    it('with reactive', () => {
      const r = reactive({ greeting: 'Hello Matt', enabled: true, count: 100 });
      const refs = toRefs(r);

      for (const key of Object.keys(r)) {
        // test getter
        assertRef(refs[key], r[key]);

        // test setter
        const value = r[key];
        refs[key].value += '!';
        assert.equal(refs[key].value, value + '!');
        assert.equal(refs[key].value, r[key]);
      }
    });
    it('with readonly', () => {
      const r = readonly({ greeting: 'Hello Matt', enabled: true, count: 100 });
      assertRefs(r);
    });
    it('with plain object', () => {
      assertRefs({ abc: 'def', foo: 'bar', baz: 'fooz' });
    });
    it('with Proxy', () => {
      const p = new Proxy({ abc: 'def', foo: 'bar', baz: 'fooz' }, {});
      assertRefs(p);
    });
    it('with string', () => {
      assert.throws(() => assertRefs('baz'));
    });
    it('with undefined', () => {
      assert.throws(() => assertRefs(undefined));
    });
  });
})
