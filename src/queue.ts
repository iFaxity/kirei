const queue: Function[] = [];
const tickPromise = Promise.resolve();

export function nextTick(fn?: () => void): Promise<void> {
  return fn ? tickPromise.then(fn) : tickPromise;
}

function flush() {
  while (queue.length) {
    const fn = queue.pop();
    fn();
  }
}

export function has(fn: Function) {
  return queue.includes(fn);
}

export function push(fn: Function) {
  if (queue.length == 0) {
    nextTick(flush);
  }

  queue.push(fn);
}
