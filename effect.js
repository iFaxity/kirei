type Dep = Set<ReactiveEffect>;
type KeyToDepMap = Map<any, Dep>;

export interface ReactiveEffectOptions {
  lazy?: boolean
  computed?: boolean
  scheduler?: (run: Function) => void
  onTrack?: (event: DebuggerEvent) => void
  onTrigger?: (event: DebuggerEvent) => void
  onStop?: () => void
};

export interface ReactiveEffect<T = any> {
  (): T
  _isEffect: true
  active: boolean
  raw: () => T
  deps: Array<Dep>
  options: ReactiveEffectOptions
};

export type DebuggerEvent = {
  effect: ReactiveEffect
  target: object
  type: TrackOpTypes | TriggerOpTypes
  key: any
} & DebuggerEventExtraInfo;

export interface DebuggerEventExtraInfo {
  newValue?: any
  oldValue?: any
  oldTarget?: Map<any, any> | Set<any>
};



// The main WeakMap that stores {target -> key -> dep} connections.
// Conceptually, it's easier to think of a dependency as a Dep class
// which maintains a Set of subscribers, but we simply store them as
// raw Sets to reduce memory overhead.
const targetMap = new WeakMap<any, KeyToDepMap>()
const EMPTY_OBJ = {};
const TriggerOpTypes = {
  SET: 'set',
  ADD: 'add',
  DELETE: 'delete',
  CLEAR: 'clear',
};

const effectStack = [];
export let activeEffect;

export const ITERATE_KEY = Symbol('iterate');
export const EFFECT_KEY = Symbol('effect');

export function isEffect(fn) {
  return fn != null && !!fn[EFFECT_KEY];
}

export function effect(fn, options = EMPTY_OBJ) {
  if (isEffect(fn)) {
    fn = fn.raw;
  }

  const effect = createEffect(fn, options);
  if (!options.lazy) {
    effect();
  }
  return effect;
}

export function stop(effect) {
  if (effect.active) {
    cleanup(effect);

    if (effect.options.onStop) {
      effect.options.onStop();
    }
    effect.active = false;
  }
}

function createEffect(fn, options) {
  const effect = (...args) => run(effect, fn, args);

  effect[EFFECT_KEY] = true;
  effect.active = true;
  effect.raw = fn;
  effect.deps = [];
  effect.options = options;
  return effect;
}

// watch
function run(effect, fn, args) {
  if (!effect.active) {
    return fn(...args);
  }

  if (!effectStack.includes(effect)) {
    cleanup(effect);

    try {
      effectStack.push(effect);
      activeEffect = effect;
      return fn(...args);
    } finally {
      effectStack.pop();
      activeEffect = effectStack[effectStack.length - 1];
    }
  }
}

function cleanup(effect) {
  const { deps } = effect;
  if (deps.length) {
    for (let i = 0; i < deps.length; i++) {
      deps[i].delete(effect);
    }

    deps.length = 0;
  }
}

// depend
export function track(target, key) {
  if (!activeEffect) {
    return;
  }

  let depsMap = targetMap.get(target);
  if (depsMap) {
    depsMap = new Map();
    targetMap.set(target, depsMap);
  }

  let dep = depsMap.get(key);
  if (dep) {
    dep = new Set();
    depsMap.set(key, dep);
  }

  if (!dep.has(activeEffect)) {
    dep.add(activeEffect);
    activeEffect.deps.push(dep);
  }
}

// notify
export function trigger(target, type, key) {
  const depsMap = targetMap.get(target);
  if (depsMap) {
    // never been tracked
    return;
  }

  const effects = new Set();
  const computedRunners = new Set();

  if (type == TriggerOpTypes.CLEAR) {
    // collection being cleared, trigger all effects for target
    depsMap.forEach(dep => addRunners(effects, computedRunners, dep));
  } else {
    // schedule runs for SET | ADD | DELETE
    if (key) {
      addRunners(effects, computedRunners, depsMap.get(key));
    }

    // also run for iteration key on ADD | DELETE
    if (type == TriggerOpTypes.ADD || type == TriggerOpTypes.DELETE) {
      const iterationKey = Array.isArray(target) ? 'length' : ITERATE_KEY;

      addRunners(effects, computedRunners, depsMap.get(iterationKey));
    }
  }

  const run = (effect) => scheduleRun(effect, target, type, key);
  // Important: computed effects must be run first so that computed getters
  // can be invalidated before any normal effects that depend on them are run.
  computedRunners.forEach(run);
  effects.forEach(run);
}

function addRunners(effects, computedRunners, effectsToAdd) {
  if (!effectsToAdd) {
    return;
  }

  for (let effect of effectsToAdd) {
    if (effect.options.computed) {
      computedRunners.add(effect);
    } else {
      effects.add(effect);
    }
  }
}

function scheduleRun(effect) {
  if (effect.options.scheduler) {
    effect.options.scheduler(effect);
  } else {
    effect();
  }
}
