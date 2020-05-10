import {
  isObject,
  isFunction,
  mapObject,
  camelToKebab,
  exception,
  error,
  warn,
} from '../../../packages/shared/dist/index.js';
import { strict as assert } from 'assert';

describe('@kirei/shared', () => {
  describe('isObject', () => {
    it('with valid argument', () => {
      class Test {}
      assert(isObject({}));
      assert(isObject([]));
      assert(isObject(Object.create(null)));
      assert(isObject(new Test()));
    });
    it('with invalid argument', () => {
      assert(!isObject());
      assert(!isObject(null));
      assert(!isObject('shh'));
      assert(!isObject(100));
      assert(!isObject(100n));
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
    it('with valid arguments', () => {});
    it('with valid arguments', () => {});
  });

  describe('camelToKebab', () => {
    it('with valid argument', () => {});
    it('with invalid argument', () => {});
  });

  describe('exception', () => {
    it('', () => {});
  });

  describe('error', () => {
    it('', () => {});
  });

  describe('warn', () => {
    it('', () => {});
  });
})
