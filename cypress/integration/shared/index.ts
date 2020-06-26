import {
  isPrimitive,
  isObject,
  isFunction,
  mapObject,
  camelToKebab,
  exception
} from '@kirei/shared';

describe('@kirei/shared', () => {
  describe('isPrimitive', () => {
    it('with string', () => assert(isPrimitive('test')));
    it('with number', () => assert(isPrimitive(123)));
    it('with boolean', () => assert(isPrimitive(true)));
    it('with undefined', () => assert(isPrimitive(undefined)));
    it('with null', () => assert(isPrimitive(null)));
    it('with symbol', () => assert(isPrimitive(Symbol())));

    it('with function', () => assert(!isPrimitive(() => {})));
    it('with object', () => assert(!isPrimitive({})));
    it('with array', () => assert(!isPrimitive([])));
  });

  describe('isObject', () => {
    it('with object', () => assert(isObject({})));
    it('with array', () => assert(isObject([])));
    it('with Object.create(null)', () => assert(isObject(Object.create(null))));
    it('with class instance', () => {
      class Test {}
      assert(isObject(new Test()));
    });

    it('with undefined', () => assert(!isObject(undefined)));
    it('with null', () => assert(!isObject(null)));
    it('with string', () => assert(!isObject('shh')));
    it('with symbol', () => assert(!isObject(Symbol())));
  });

  describe('isFunction', () => {
    it('with lambda fn', () => assert(isFunction(() => {})));
    it('with function', () => assert(isFunction(assert)));

    it('with undefined', () => assert(!isFunction(undefined)));
    it('with null', () => assert(!isFunction(null)));
    it('with string', () => assert(!isFunction('abc')));
    it('with boolean', () => assert(!isFunction(false)));
  });

  describe('mapObject', () => {
    it('basic usage', () => {
      const input = {
        foo: 'foo', bar: 'bar'
      };

      const res = mapObject((key, value) => {
        return [ key + 'x', value + 'z' ];
      }, input);

      assert.deepEqual(res, {
        foox: 'fooz', barx: 'barz',
      });
      assert.deepEqual(input, {
        foo: 'foo', bar: 'bar'
      })
    });
  });

  describe('camelToKebab', () => {
    it('with PascalCase', () => assert.equal(camelToKebab('HelloWorld'), 'hello-world'));
    it('with kebab-case', () => assert.equal(camelToKebab('kebab-yum-jum'), 'kebab-yum-jum'));
    it('with camelCase', () => assert.equal(camelToKebab('heyLittleFriend'), 'hey-little-friend'));
    it('with Kebab-Case', () => assert.equal(camelToKebab('Foo-Bar'), 'foo-bar'));

    it('with number', () => assert.throws(() => camelToKebab(100 as any)));
    it('with null', () => assert.throws(() => camelToKebab(null)));
  });

  describe('exception', () => {
    it('throws with custom message', () => {
      assert.throws(() => exception('Test message'));
    });
  });
})
