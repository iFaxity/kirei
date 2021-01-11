// @ts-nocheck
/// <reference types="cypress" />
import {
  isObject,
  isUndefined,
  mapObject,
} from '@kirei/shared';

describe('#isObject()', () => {
  it('with object', () => assert(isObject({})));
  it('with array', () => assert(isObject([])));
  it('with Object.create(null)', () => assert(isObject(Object.create(null))));
  it('with class instance', () => {
    class Test {}
    assert(isObject(new Test()));
  });

  it('with undefined', () => assert(!isObject()));
  it('with null', () => assert(!isObject(null)));
  it('with string', () => assert(!isObject('shh')));
  it('with symbol', () => assert(!isObject(Symbol())));
});

describe('#isUndefined()', () => {
  it('with implicit undefined', () => assert(isUndefined()));
  it('with explicit undefined', () => assert(isUndefined(void 0)));

  it('with null', () => assert(!isUndefined(null)));
  it('with symbol', () => assert(!isUndefined(Symbol())));
  it('with string', () => assert(!isUndefined('undefined')));
});

describe('#mapObject()', () => {
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
    });
  });
});
