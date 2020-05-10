"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let queue = new Set();
const tickPromise = Promise.resolve();
/**
 * Flushes the queue, calling all the functions
 * @returns {void}
 */
function flush() {
    queue.forEach(fn => fn());
    queue = new Set();
}
/**
 * Wait for next flush of the queue, as a Promise or as a callback function
 * @param {Function} [fn] Optional callback function
 * @returns {Promise}
 */
function nextTick(fn) {
    return fn ? tickPromise.then(fn) : tickPromise;
}
exports.nextTick = nextTick;
/**
 * Pushes a function to the queue, if it doesn't already exist
 * @param {Function} fn Function to enqueue
 * @returns {void}
 */
function push(fn) {
    const queueFlush = queue.size == 0;
    queue.add(fn);
    queueFlush && nextTick(flush);
}
exports.push = push;
//# sourceMappingURL=queue.js.map