/// <reference types="cypress" />
import { nextTick, push, flush, queue } from '@kirei/element/dist/queue';

describe('queue', () => {
  beforeEach(() => queue.clear());

  describe('#nextTick()', () => {
    it('without argument', async () => {
      const res = nextTick();
      assert.instanceOf(res, Promise);
      await res;
    });
    it('with function', async () => {
      let count = 0;
      await nextTick(() => { count++; });
      assert.equal(count, 1);
    });
    it('with string', () => {
      assert.throws(() => nextTick('hello world'));
    });
    it('with Promise', async () => {
      const p = Promise.resolve();
      assert.throws(() => nextTick(p));
    });
  });

  describe('#push()', () => {
    it('without argument', () => {
      assert.isEmpty(queue);
      assert.throws(() => push());
      assert.isEmpty(queue);
    });
    it('with function', () => {
      const fn = () => {};

      assert.isEmpty(queue);
      push(fn);
      assert.isNotEmpty(queue);
      assert(queue.has(fn));
    });
    it('with null', () => {
      assert.isEmpty(queue);
      assert.throws(() => push(null));
      assert.isEmpty(queue);
    });
    it('with Promise', () => {
      assert.isEmpty(queue);
      assert.throws(() => push(Promise.resolve()));
      assert.isEmpty(queue);
    });
    it('check flush + call order', async () => {
      let tick = 0;
      assert.isEmpty(queue);
      push(() => assert.equal(++tick, 1));
      assert.isNotEmpty(queue);

      // pre and post-flush check
      assert.equal(tick, 0);
      await nextTick();
      assert.equal(tick, 1);
      assert.isEmpty(queue);
    });
  });

  describe('#flush()', () => {
    it('with empty queue', () => {
      assert.isEmpty(queue)
      flush();
      assert.isEmpty(queue);
    });
    it('with one item', () => {
      let tick = 0;
      assert.isEmpty(queue);
      queue.add(() => assert.equal(++tick, 1));

      // pre and post-flush check
      assert.equal(tick, 0);
      flush();
      assert.equal(tick, 1);
    });
    it('with multiple items', () => {
      let tick = 0;
      assert.isEmpty(queue);
      queue.add(() => assert.equal(++tick, 1));
      queue.add(() => assert.equal(++tick, 2));
      queue.add(() => assert.equal(++tick, 3));

      // pre and post-flush check
      assert.equal(tick, 0);
      flush();
      assert.equal(tick, 3);
    });
    it('with non function in queue', () => {
      assert.isEmpty(queue);
      queue.add(200);

      assert.throws(() => flush());
    });
  });
});
