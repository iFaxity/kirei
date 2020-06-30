/// <reference types="cypress" />
import { baseHandlers, collectionHandlers } from '@kirei/fx/dist/proxyHandlers';
import { ref, isReactive, isRef } from '@kirei/fx';


let target, proxy;
// used to prepare proxy object for testing
function prepareProxyHook(isCollection, createTarget) {
  return (immutable, ) => {
    return () => {
      target = createTarget();
      const handlers = (isCollection ? collectionHandlers : baseHandlers)(immutable, target);
      proxy = new Proxy(target, handlers);
    }
  }
}

describe('@ifaxity/fx/proxyHandlers', () => {
  describe('#baseHandlers()', () => {
    describe('with object', () => {
      const proxyHook = prepareProxyHook(
        false,
        () => ({ foo: 'bar', baz: ref('hi') })
      );

      describe('mutable', () => {
        beforeEach(proxyHook(false));

        it('#get()', () => {
          assert.equal(proxy.foo, 'bar');
          // Check ref unwrapping
          assert.equal(proxy.baz, 'hi');
        });
        it('#set()', () => {
          proxy.foo = 'fooz';
          assert.equal(proxy.foo, 'fooz');

          assert.notEqual(proxy.bar, 10);
          proxy.bar = 10;
          assert.equal(proxy.bar, 10);

          // check ref swapping & updating
          proxy.baz = -1;
          assert.equal(proxy.baz, -1);

          proxy.baz = ref('zab');
          assert.equal(proxy.baz, 'zab');
        });
        it('#delete()', () => {
          proxy.greeting = 'Hello there';
          assert.equal(proxy.greeting, 'Hello there');

          delete proxy.greeting;
          assert.equal(typeof proxy.greeting, 'undefined');
        });
        it('#has()', () => {
          assert('foo' in proxy);
          assert.equal('FOO' in proxy, false);
        });
        it('#ownKeys()', () => {
          const keys = Object.keys(proxy);
          assert.deepEqual(keys, [ 'foo', 'baz' ]);
        });
      });

      describe('immutable', () => {
        beforeEach(proxyHook(true));

        it('#get()', () => {
          assert.equal(proxy.foo, 'bar');
          // Check ref unwrapping
          assert.equal(proxy.baz, 'hi');
        });
        it('#set()', () => {
          assert.throws(() => { proxy.foo = 'fooz'; });
          assert.notEqual(proxy.foo, 'fooz');

          assert.notEqual(proxy.bar, 10);
          assert.throws(() => { proxy.bar = 10; });
          assert.notEqual(proxy.bar, 10);

          // check ref swapping & updating
          assert.throws(() => { proxy.baz = -1; });
          assert.notEqual(proxy.baz, -1);

          assert.throws(() => { proxy.baz = ref('zab') });
          assert.notEqual(proxy.baz, 'zab');
        });
        it('#delete()', () => {
          assert.equal(proxy.foo, 'bar');
          assert.throws(() => { delete proxy.greeting; });
          assert.equal(proxy.foo, 'bar');
        });
      });
    });

    describe('with array', () => {
      const proxyHook = prepareProxyHook(
        false,
        () => [ 'first', 'second', 'first', ref('hi') ]
      );

      describe('mutable', () => {
        beforeEach(proxyHook(false));

        it('#get()', () => {
          assert.equal(proxy[0], 'first');
          // Check ref not unwrapping
          assert(isRef(proxy[3]));
        });
        it('#set()', () => {
          proxy[2] = 'third';
          assert.equal(proxy[2], 'third');

          assert.notEqual(proxy[4], 10);
          proxy[4] = 10;
          assert.equal(proxy[4], 10);

          // ref should not swap like object
          proxy[3] = -1;
          assert.notEqual(proxy[3].value, -1);
        });
        it('#delete()', () => {
          proxy[5] = 'Hello there';
          assert.equal(proxy[5], 'Hello there');

          delete proxy[5];
          assert.equal(proxy[5], undefined);
        });
        it('#has()', () => {
          assert('1' in proxy);
          assert.equal('FOO' in proxy, false);
        });
        it('#ownKeys()', () => {
          const keys = Object.keys(proxy);
          assert.deepEqual(keys, [ '0', '1', '2', '3' ]);
        });

        // Test search shims
        describe('search shims', () => {
          it('#indexOf()', () => {
            assert.equal(proxy.indexOf('second'), 1);
            assert.equal(proxy.indexOf('third'), -1);
          });
          it('#lastIndexOf()', () => {
            assert.equal(proxy.lastIndexOf('first'), 2);
            assert.equal(proxy.lastIndexOf('fifth'), -1);
          });
          it('#includes()', () => {
            assert(proxy.includes('first'));
            assert(!proxy.includes('fourth'));
          });
        });
      });

      describe('immutable', () => {
        beforeEach(proxyHook(true));

        it('#get()', () => {
          assert.equal(proxy[0], 'first');
          // Check ref not unwrapping
          assert(isRef(proxy[3]));
        });
        it('#set()', () => {
          assert.throws(() => { proxy[2] = 'third'; });
          assert.notEqual(proxy[2], 'third');

          assert.notEqual(proxy[4], 10);
          assert.throws(() => { proxy[4] = 10; });
          assert.notEqual(proxy[4], 10);

          // ref should not swap like object
          assert.throws(() => { proxy[3] = -1; });
          assert.notEqual(proxy[3].value, -1);
        });
        it('#delete()', () => {
          assert.throws(() => { delete proxy[0]; });
          assert.notEqual(typeof proxy[0], 'undefined');
        });
      });
    });
  });

  describe('#collectionHandlers()', () => {
    describe('with Map', () => {
      const proxyHook = prepareProxyHook(
        true,
        () => new Map([ ['foo', 'bar'], ['baz', ref('hi')] ]),
      );

      describe('mutable', () => {
        beforeEach(proxyHook(false));

        it('#get()', () => {
          assert.equal(proxy.get('foo'), 'bar');
          // Check ref unwrapping
          assert.equal(proxy.get('baz'), 'hi');
        });
        it('#set()', () => {
          proxy.set('foo', 'fooz');
          assert.equal(proxy.get('foo'), 'fooz');

          assert.notEqual(proxy.get('bar'), 10);
          proxy.set('bar', 10);
          assert.equal(proxy.get('bar'), 10);

          // ref should swap, but not update
          proxy.set('baz', -1);
          assert.notEqual(proxy.get('baz').value, -1);

          proxy.set('baz', ref('zab'));
          assert.equal(proxy.get('baz'), 'zab');
        });
        it('#has()', () => {
          assert.ok(proxy.has('foo'));
          assert.ok(!proxy.has('bar'));
        });
        it('#delete()', () => {
          proxy.set('greeting', 'Hello there');
          assert.equal(proxy.get('greeting'), 'Hello there');

          proxy.delete('greeting');
          assert.equal(typeof proxy.get('greeting'), 'undefined');
        });
        it('#clear()', () => {
          assert.equal(proxy.size, 2);
          proxy.clear();
          assert.equal(proxy.size, 0);
        });
        it('#forEach()', () => {
          proxy.forEach((value, key) => {
            assert.equal(value, target.get(key));
          });
        });
      });

      describe('immutable', () => {
        beforeEach(proxyHook(true));

        it('#get()', () => {
          assert.equal(proxy.get('foo'), 'bar');
          // Check ref unwrapping
          assert.equal(proxy.get('baz'), 'hi');
        });
        it('#set()', () => {
          assert.throws(() => { proxy.set('foo', 'fooz'); });
          assert.notEqual(proxy.get('foo'), 'fooz');

          assert.notEqual(proxy.get('bar'), 10);
          assert.throws(() => { proxy.set('bar', 10); });
          assert.notEqual(proxy.get('bar'), 10);
        });
        it('#delete()', () => {
          assert.throws(() => { proxy.delete('foo'); });
          assert.notEqual(typeof proxy.get('foo'), 'undefined');
        });
        it('#clear()', () => {
          assert.equal(proxy.size, 2);
          assert.throws(() => { proxy.clear(); });
          assert.equal(proxy.size, 2);
        });
      });
    });

    describe('with Set', () => {
      const proxyHook = prepareProxyHook(
        true,
        () => new Set(['first', 'second', 'first', ref('hi')]),
      );

      describe('mutable', () => {
        beforeEach(proxyHook(false));

        it('#add()', () => {
          assert(!target.has('third'));
          proxy.add('third');
          assert(target.has('third'));
        });
        it('#has()', () => {
          assert(!proxy.has('hello'));
          target.add('hello');
          assert(proxy.has('hello'));
        });
        it('#delete()', () => {
          assert(target.has('first'));
          proxy.delete('first');
          assert(!target.has('first'));
        });
        it('#clear()', () => {
          assert.equal(target.size, 3);
          proxy.clear();
          assert.equal(target.size, 0);
        });
        it('#forEach()', () => {
          proxy.forEach(item => assert(target.has(item)));
        });
  
      });
      describe('immutable', () => {
        beforeEach(proxyHook(true));

        it('#add()', () => {
          assert(!target.has('third'));
          assert.throws(() => { proxy.add('third'); });
          assert(!target.has('third'));
        });
        it('#delete()', () => {
          assert(target.has('first'));
          assert.throws(() => { proxy.delete('first'); });
          assert(target.has('first'));
        });
        it('#clear()', () => {
          assert.equal(target.size, 3);
          assert.throws(() => { proxy.clear(); });
          assert.notEqual(target.size, 0);
        });
      });
    });

    /* Maybe skip weak variants as they work in the same way.
    describe('with WeakMap', () => {
      describe('mutable', () => {});
      describe('immutable', () => {});
    });
    describe('with WeakSet', () => {
      describe('mutable', () => {});
      describe('immutable', () => {});
    });*/
  });
});
