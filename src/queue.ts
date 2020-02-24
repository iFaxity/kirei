const queue: Function[] = [];
let rafId: number = null;

export function scheduleFlush() {
  rafId = requestAnimationFrame(flush);
}

export function cancel() {
  if (rafId == null) return;
  cancelAnimationFrame(rafId);
  rafId = null;
}

export function flush() {
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
    scheduleFlush();
  }

  queue.push(fn);
}
