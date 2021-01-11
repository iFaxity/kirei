// @ts-nocheck
/// <reference types="cypress" />
import * as queue from '@kirei/element/runtime/queue';

const UNDEFINED = void 0; // undefined

describe('queue', () => {
  beforeEach(() => queue.clear());

  describe('#nextTick()', () => {
    it('without argument', () => {
      const res = queue.nextTick();
      assert.instanceOf(res, Promise);
      return res;
    });
    it('with function', async () => {
      let count = 0;
      await queue.nextTick(() => { count++; });
      assert.equal(count, 1);
    });
    it('with string', () => {
      assert.throws(() => queue.nextTick('hello world'));
    });
    it('with Promise', () => {
      const p = Promise.resolve();
      assert.throws(() => queue.nextTick(p));
    });
  });

  describe('#push()', () => {
    it('without argument', () => {
      assert(!queue.has(UNDEFINED));
      assert.throws(() => queue.push(UNDEFINED));
      assert(!queue.has(UNDEFINED));
    });
    it('with function', () => {
      const fn = () => {};

      assert(!queue.has(fn));
      queue.push(fn);
      assert(queue.has(fn));
    });
    it('with null', () => {
      assert(!queue.has(null));
      assert.throws(() => queue.push(null));
      assert(!queue.has(null));
    });
    it('with Promise', () => {
      let p = Promise.resolve();
      assert(!queue.has(p));
      assert.throws(() => queue.push(p));
      assert(!queue.has(p));
    });
    it('check flush + call order', async () => {
      const fn = () => assert.equal(++tick, 1);
      let tick = 0;

      assert(!queue.has(fn));
      queue.push(fn);
      assert(queue.has(fn));

      // pre and post-flush check
      assert.equal(tick, 0);
      await queue.nextTick();
      assert.equal(tick, 1);
      assert(!queue.has(fn));
    });
  });

  describe('#flush()', () => {
    it('with empty queue', () => queue.flush());
    it('with single item', () => {
      let tick = 0;
      assert.equal(queue.size(), 0);
      queue.push(() => assert.equal(++tick, 1));

      // pre and post-flush check
      assert.equal(tick, 0);
      assert.equal(queue.size(), 1);
      queue.flush();
      assert.equal(tick, 1);
      assert.equal(queue.size(), 0);
    });
    it('with multiple items', () => {
      let tick = 0;
      assert.equal(queue.size(), 0);

      // push calls flush async, but call it sync later
      queue.push(() => assert.equal(++tick, 1));
      queue.push(() => assert.equal(++tick, 2));
      queue.push(() => assert.equal(++tick, 3));

      // pre and post-flush check
      assert.equal(tick, 0);
      queue.flush();
      assert.equal(tick, 3);
    });
  });
});
