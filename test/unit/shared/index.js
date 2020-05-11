const {
  isPrimitive,
  isObject,
  isFunction,
  mapObject,
  camelToKebab,
  exception
} = require('../../../packages/shared/dist');
const { strict: assert } = require('assert');

describe('@kirei/shared', () => {
  describe('isPrimitive', () => {
    it('with valid argument', () => {
      assert(isPrimitive('string'));
      assert(isPrimitive(100));
      assert(isPrimitive(true));
      assert(isPrimitive(false));
      assert(isPrimitive(undefined));
      assert(isPrimitive(null));
      assert(isPrimitive(Symbol()));
    });
    it('with invalid argument', () => {
      assert(!isPrimitive(() => {}));
      assert(!isPrimitive({}));
      assert(!isPrimitive([]));
    });
  });

  describe('isObject', () => {
    it('with valid argument', () => {
      assert(isObject({}));
      assert(isObject([]));
      assert(isObject(Object.create(null)));

      class Test {}
      assert(isObject(new Test()));
    });
    it('with invalid argument', () => {
      assert(!isObject());
      assert(!isObject(null));
      assert(!isObject('shh'));
      assert(!isObject(100));
    });
  });

  describe('isFunction', () => {
    it('with valid argument', () => {
      assert(isFunction(() => {}));
      assert(isFunction(assert));
    });
    it('with invalid argument', () => {
      assert(!isFunction());
      assert(!isFunction(null));
      assert(!isFunction('notafunction'));
      assert(!isFunction(false));
    });
  });

  describe('mapObject', () => {
    it('basic usage', () => {
      const input = {
        foo: 'foo', bar: 'bar'
      };

      const res = mapObject((key, value) => {
        return [ key, value + 'z' ];
      }, input);

      assert.deepEqual(res, {
        foo: 'fooz', bar: 'barz',
      });
      assert.deepEqual(input, {
        foo: 'foo', bar: 'bar'
      })
    });
  });

  describe('camelToKebab', () => {
    it('with valid argument', () => {
      assert.equal(camelToKebab('HelloWorld'), 'hello-world');
      assert.equal(camelToKebab('hello-world'), 'hello-world');
      assert.equal(camelToKebab('helloWorld'), 'hello-world');
      assert.equal(camelToKebab('Hello-World'), 'hello-world');
    });
    it('with invalid argument', () => {
      assert.throws(() => camelToKebab(100), TypeError);
      assert.throws(() => camelToKebab(null), TypeError);
    });
  });

  describe('exception', () => {
    it('validate message format', () => {
      try {
        exception('Test message');
      } catch (ex) {
        assert.equal(ex.message, '[Kirei]: Test message');
      }
    })
    it('throws when called', () => {
      assert.throws(() => exception('Error'), Error);
    });
  });
})
