import { KireiInstance, KireiElement, HookTypes, CSSResult, defineElement } from '@kirei/element';
import { normalizeOptions, ElementOptions, NormalizedElementOptions } from '@kirei/element/dist/element';
import { isObject } from '@kirei/shared';

// TODO: reflow sync but if sync changed, then reflow parent too.
const DENY_OPTIONS = [ 'name', 'tag', 'hooks', 'closed', 'sync' ];
const hmrCache = new Map<string, HMRCache>();

interface HMRCache {
  ctor: typeof KireiElement;
  instances: Set<KireiInstance>;
}

// Utility functions
function injectHook(ctor: typeof KireiElement, key: string, fn: Function): void {
  const { options } = ctor;
  if (!options.hooks) {
    options.hooks = {};
  }

  if (!options.hooks[key]) {
    options.hooks[key] = [ fn ];
  } else {
    options.hooks[key].push(fn);
  }
}

function stylesChanged(oldStyles: CSSResult[], newStyles: CSSResult[]): boolean {
  if (oldStyles.length != newStyles.length) {
    return true;
  }

  return !oldStyles.every((style, idx) => style.cssText === newStyles[idx].cssText);
}

function syncChanged(oldOptions: NormalizedElementOptions, newOptions: NormalizedElementOptions): boolean {
  const oldSync = oldOptions.sync;
  const newSync = newOptions.sync;

  if (oldSync !== newSync) {
    if (isObject(oldSync) && isObject(newSync)) {
      if (oldSync.event !== newSync.event || oldSync.prop !== newSync.prop) {
        return true;
      }
    } else {
      return true;
    }
  }

  return false;
}

// API methods
function generateId(filename: string, opts: ElementOptions): string {
  return `${filename}#${opts.name}`;
}

export function has(id: string, opts: ElementOptions): boolean {
  return hmrCache.has(generateId(id, opts));
}

export function createOrUpdate(id: string, opts: ElementOptions): typeof KireiElement {
  return has(id, opts) ? update(id, opts) : create(id, opts);
}

// Solely creates a new element, won't recreate
export function create(filename: string, opts: ElementOptions): typeof KireiElement {
  const id = generateId(filename, opts);
  const cache = hmrCache.get(id);
  if (cache) {
    return cache.ctor;
  }

  const ctor = defineElement(opts);
  ctor.options.filename = filename;

  const instances = new Set<KireiInstance>();
  hmrCache.set(id, { ctor, instances });

  // Inject lifecycle hooks to track HMR
  injectHook(ctor, HookTypes.BEFORE_MOUNT, function () { instances.add(this); });
  injectHook(ctor, HookTypes.BEFORE_UNMOUNT, function () { instances.delete(this); });
  return ctor;
}

export function update(filename: string, options: ElementOptions): typeof KireiElement {
  const { ctor, instances } = hmrCache.get(generateId(filename, options));
  const opts = normalizeOptions(options);

  // update options (persist vital options)
  let reflowStyles = false;
  let updateParent = false;
  for (const key of Object.keys(opts)) {
    if (!DENY_OPTIONS.includes(key)) {
      if (key == 'styles') {
        reflowStyles = stylesChanged(ctor.options[key], opts[key]);
      } else if (key == 'sync') {
        updateParent = syncChanged(ctor.options, opts);
      }

      ctor.options[key] = opts[key];
    }
  }

  /* TODO: only reflow styles if template or styles changed.
   * 1. update options
   * 2. reload setup function
   * 3. schedule update (will only full re-render if template changed, otherwise only reflow directives)
   */
  for (const instance of instances) {
    instance.options = ctor.options;
    instance.setup();
    instance.fx.scheduleRun();

    // Update parent if sync changed
    if (updateParent && instance.parent) {
      instance.parent.fx.scheduleRun();
    }

    // Update styles
    if (reflowStyles) {
      instance.reflowStyles();
    }
  }

  console.log(`[Kirei HMR]: Updated <${ctor.options.name}>.`);
  return ctor;
}
