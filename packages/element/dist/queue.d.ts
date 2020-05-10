/**
 * Wait for next flush of the queue, as a Promise or as a callback function
 * @param {Function} [fn] Optional callback function
 * @returns {Promise}
 */
export declare function nextTick(fn?: () => void): Promise<void>;
/**
 * Pushes a function to the queue, if it doesn't already exist
 * @param {Function} fn Function to enqueue
 * @returns {void}
 */
export declare function push(fn: Function): void;
//# sourceMappingURL=queue.d.ts.map