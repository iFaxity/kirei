const queue = [];
const tickPromise = Promise.resolve();
export function nextTick(fn) {
    return fn ? tickPromise.then(fn) : tickPromise;
}
function flush() {
    while (queue.length) {
        const fn = queue.pop();
        fn();
    }
}
export function has(fn) {
    return queue.includes(fn);
}
export function push(fn) {
    if (queue.length == 0) {
        nextTick(flush);
    }
    queue.push(fn);
}
//# sourceMappingURL=queue.js.map