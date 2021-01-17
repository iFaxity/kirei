import { isFunction } from '@vue/shared';

let queue: Function[] = [];
const tickPromise = Promise.resolve();

/**
 * Clears queue stack, only intended for testing
 * @private
 */
export function clear(): void {
  queue = [];
}

/**
 * Checks if queue has function in its stack, only intended for testing
 * @param fn - Function to check for
 * @returns If the queue contains the specified item
 * @private
 */
export function has(fn: Function): boolean {
  return queue.includes(fn);
}

/**
 * Checks if queue has function in its stack, only intended for testing
 * @returns The amount of items in the queue
 * @private
 */
export function size(): number {
  return queue.length;
}

/**
 * Flushes the queue, calling all the functions in the queue
 * @private
 */
export function flush(): void {
  for (let i = 0; i < queue.length; i++) {
    queue[i]();
  }
  clear();
}

/**
 * Wait for next flush of the queue, as a Promise or as a callback function
 * @param fn - Optional callback function
 */
export function nextTick(fn?: () => void): Promise<void> {
  if (fn != null && !isFunction(fn)) {
    throw new TypeError(`nextTick expected a function or undefined, got ${typeof fn}`);
  }

  return fn ? tickPromise.then(fn) : tickPromise;
}

/**
 * Pushes a function to the queue, if it doesn't already exist
 * @param fn - Function to enqueue
 * @private
 */
export function push(fn: () => void): void {
  if (!isFunction(fn)) {
    throw new TypeError(`Queue push expected a function, got ${typeof fn}`);
  }

  queue.length || nextTick(flush);
  has(fn) || queue.push(fn);
}
