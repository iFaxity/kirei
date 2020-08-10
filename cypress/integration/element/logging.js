/// <reference types="cypress" />
import { exception, error, warn } from '@kirei/element/dist/logging';

function assertConsole(name, callback, expected) {
  const nativeFn = console[name];
  let message;

  // shim console function (substring to remove enclosing square brackets)
  console[name] = function (data) {
    message = data instanceof Error ? data.message : data;
  };
  try {
    callback();
    assert.equal(message, expected);
  } finally {
    console[name] = nativeFn;
  }
}

describe('logging', () => {
  describe('#exception()', () => {
    it('with message', () => {
      try {
        exception('Test message');
      } catch (ex) {
        assert.equal(ex.message, 'Test message');
        return;
      }
      assert.fail('expected exception to be thrown');
    });
    it('with context', () => {
      try {
        exception('Test message', 'context()');
      } catch (ex) {
        assert.equal(ex.message, 'Test message in #context().');
        return;
      }
      assert.fail('expected exception to be thrown');
    });
  });

  describe('#error()', () => {
    it('with message', () => {
      const fn = () => error('Error message');
      assertConsole('error', fn, 'Error message');
    });
    it('with context', () => {
      const fn = () => error('Error message', 'hello()');
      assertConsole('error', fn, 'Error message in #hello().');
    });
  });

  describe('#warn()', () => {
    it('with message', () => {
      const fn = () => warn('Warning message');
      assertConsole('warn', fn, 'Warning message');
    });
    it('with context', () => {
      const fn = () => warn('Warning message', 'warn()');
      assertConsole('warn', fn, 'Warning message in #warn().');
    });
  });
});
