const queue = new Set<Function>();
const tickPromise = Promise.resolve();

/**
 * Wait for next flush of the queue, as a Promise or as a callback function
 * @param {Function} [fn] Optional callback function
 * @returns {Promise}
 */
export function nextTick(fn?: () => void): Promise<void> {
  return fn ? tickPromise.then(fn) : tickPromise;
}

/**
 * Flushes the queue, calling all the functions
 * @returns {void}
 */
function flush(): void {
  queue.forEach(fn => fn());
  queue.clear();
}

/**
 * Checks if queue has a function queued
 * @param {Function} fn Function to check
 * @returns {boolean}
 */
export function has(fn: Function): boolean {
  return queue.has(fn);
}

/**
 * Pushes a function to the queue, if it doesn't already exist
 * @param {Function} fn Function to enqueue
 * @returns {void}
 */
export function push(fn: Function): void {
  const queueFlush = queue.size == 0;
  queue.add(fn);
  queueFlush && nextTick(flush);
}
