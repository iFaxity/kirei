// @ts-nocheck
/// <reference types="cypress" />
import { exception, error, warn } from '@kirei/element/warn';

const assertWarn = (callback: () => void, expected: string) => assertConsole('warn', callback, expected);
const assertError = (callback: () => void, expected: string) => assertConsole('error', callback, expected);

function assertConsole(name: string, callback: () => void, expected: string) {
  const spy = cy.spy(console, name);
  try {
    callback();
    spy.calledWith(expected);
  } finally {
    spy.restore();
  }
}

function assertException(callback: () => void, error: string|Error) {
  try {
    callback();
    assert.fail('Expected exception to be thrown.');
  } catch (ex) {
    if (typeof error == 'string') {
      assert.equal(ex.message, error, `Expected '${ex}' to equal '${error}'.`);
    } else {
      assert.instanceOf(ex, error, `Expected exception to be an instance of '${error.constructor.name}', got ${ex.constructor.name}.`);
    }
  }
}

describe('warn', () => {
  describe('#exception()', () => {
    it('with message', () => {
      assertException(() => exception('Test message'), 'Test message');
    });
    it('with context', () => {
      assertException(() => exception('Test message', 'context()'), 'Test message in #context().');
    });
  });

  describe('#error()', () => {
    it('with message', () => {
      assertError(() => error('Error message'), 'Error message');
    });
    it('with context', () => {
      assertError(() => error('Error message', 'hello()'), 'Error message in #hello().');
    });
  });

  describe('#warn()', () => {
    it('with message', () => {
      assertWarn(() => warn('Warning message'), 'Warning message');
    });
    it('with context', () => {
      assertWarn(() => warn('Warning message', 'warn()'), 'Warning message in #warn().');
    });
  });
});
