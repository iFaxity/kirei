let activeTarget = null;
const targetMap = new WeakMap(); // <any, >

function depend(target) {
  let deps = targetMap.get(target);

  if (!deps) {
    deps = new Set();
  }
}

function notify(target, key) {

}

function watch(target) {
  activeTarget = target;
  target();
  activeTarget = null;
}

function reactive(target) {
  const self = new Proxy(target, {
    get(_, prop) {
      if (activeTarget && targetMap.has(activeTarget)) {
        depend(self, activeTarget);
      }
    },
    set(_, prop, newValue) {
      notify();
    },
    deleteProperty(_, prop) {
      notify();
    }
  });

  return self;
}

function convert(target) {
  const isObject = typeof target == 'object' && target != null;
  return isObject ? reactive(target) : target;
}


function ref(target) {
  // if target is object create proxy for it
  let value = convert(target);

  const self = {
    get value() {
      subscribe(self, 'value');
      return value;
    },
    set value(newValue) {
      value = convert(newValue);
      notify(self, 'value');
    },
  };
}
