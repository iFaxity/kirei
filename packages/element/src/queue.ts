import { isFunction } from '@kirei/shared';

const tickPromise = Promise.resolve();
// exported for testing
export const queue = new Set<Function>();

/**
 * Flushes the queue, calling all the functions in the queue
 * @returns {void}
 */
export function flush(): void {
  for (const fn of queue) fn();
  queue.clear();
}

/**
 * Wait for next flush of the queue, as a Promise or as a callback function
 * @param {Function} [fn] Optional callback function
 * @returns {Promise}
 */
export function nextTick(fn?: () => void): Promise<void> {
  if (fn != null && !isFunction(fn)) {
    throw new TypeError(`nextTick expected a function or undefined, got ${typeof fn}`);
  }

  return fn ? tickPromise.then(fn) : tickPromise;
}

/**
 * Pushes a function to the queue, if it doesn't already exist
 * @param {Function} fn Function to enqueue
 * @returns {void}
 */
export function push(fn: () => void): void {
  if (!isFunction(fn)) {
    throw new TypeError(`Queue push expected a function, got ${typeof fn}`);
  }

  if (!queue.size) {
    nextTick(flush);
  }
  queue.add(fn);
}
