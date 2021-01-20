import { ComponentInstance, Component, HookTypes, StyleSheet, CSSResult, defineComponent, normalizeOptions, ComponentOptions } from '@kirei/element';

/**
 * Cache for a component and its instances
 */
const hmrCache = new Map<string, HMRCache>();

/**
 * HMR cache item
 */
interface HMRCache {
  /**
   * Element constructor, to modify static options
   */
  ctor: typeof Component;

  /**
   * Active instances with HMR enabled
   */
  instances: Set<ComponentInstance>;
}

/**
 * Injects a global hook on the component,
 * will last throughout every instances lifecycle
 * @param ctor - Constructor of a Component
 * @param key - Lifecycle hook key
 * @param fn - Function to push to the hooks stack
 */
function injectHook(ctor: typeof Component, key: string, fn: Function): void {
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

/**
 * Checks if the styles changed, prevents unnecessary reflow
 * @param oldStyles - Old stylesheets to replace
 * @param newStyles - New stylesheets to swap to
 * @returns True if any stylesheet has changed
 */
function stylesChanged(oldStyles: StyleSheet[], newStyles: StyleSheet[]): boolean {
  if (oldStyles.length != newStyles.length) {
    return true;
  }

  return !oldStyles.every((style, idx) => {
    const other = newStyles[idx];

    // Only check equality for style, not for CSSStyleSheet
    if ((style instanceof CSSResult) && (other instanceof CSSResult)) {
      return style.cssText === other.cssText;
    }

    return style === other;
  });
}

/**
 * Generates an ID for a component
 * @param filename - Filename where component was defined
 * @param opts - Component options
 * @returns Generated component id
 */
function generateId(filename: string, opts: ComponentOptions): string {
  return `${filename}#${opts.name}`;
}

/**
 * Checks if HMR already has component with the same id stored
 * @param filename - Filename where component was defined
 * @param opts - Component options
 * @returns True if instance is already in the cache
 */
export function has(filename: string, opts: ComponentOptions): boolean {
  return hmrCache.has(generateId(filename, opts));
}

/**
 * Stores a component to cache or updates it and all of its active instances
 * @param filename - Filename where component was defined
 * @param opts - Options to update
 * @returns Component constructor
 */
export function createOrUpdate(filename: string, opts: ComponentOptions): typeof Component {
  return has(filename, opts) ? update(filename, opts) : create(filename, opts);
}

/**
 * Solely creates a new component, if component already exists, it will return its constructor
 * @param filename - Filename where component was defined
 * @param opts - Options to define component with
 * @returns Component constructor
 */
export function create(filename: string, opts: ComponentOptions): typeof Component {
  const id = generateId(filename, opts);
  const cache = hmrCache.get(id);
  if (cache) {
    return cache.ctor;
  }

  const ctor = defineComponent(opts);
  const instances = new Set<ComponentInstance>();
  ctor.options.filename = filename;
  hmrCache.set(id, { ctor, instances });

  // Inject lifecycle hooks to track HMR
  injectHook(ctor, HookTypes.BEFORE_MOUNT, function () { instances.add(this); });
  injectHook(ctor, HookTypes.BEFORE_UNMOUNT, function () { instances.delete(this); });
  return ctor;
}

/**
 * Updates component options and all of its instances
 * @param filename - Filename where component was defined
 * @param opts - Options to update component with
 * @returns Component constructor
 */
export function update(filename: string, opts: ComponentOptions): typeof Component {
  const { ctor, instances } = hmrCache.get(generateId(filename, opts));
  const options = normalizeOptions(opts);

  // update options (persist vital options)
  const reflowStyles = ctor.options.styles && stylesChanged(ctor.options.styles, options.styles);

  // Update properties
  Object.assign(ctor.options, options);

  /*for (const key of Object.keys(options).filter(key => !DENY_OPTIONS.includes(key))) {
    if (key == 'styles') {
      reflowStyles = stylesChanged(ctor.options[key], options[key]);
    }

    ctor.options[key] = options[key];
  }*/

  /* TODO: only reflow styles if template or styles changed.
   * 1. update options
   * 2. reload setup function
   * 3. schedule update (will only full re-render if template changed, otherwise only reflow patchers)
   */

  // TODO: maybe call unmount and mount hooks?
  for (const instance of instances) {
    instance.options = ctor.options;

    // TODO: instead of recreating setup, why not just recrate the entire instance?
    instance.setup();
    instance.effect.options.scheduler(instance.effect);

    // Update styles
    if (reflowStyles) {
      instance.reflowStyles();
    }
  }

  console.log(`[Kirei HMR]: Updated <${ctor.options.name}>.`);
  return ctor;
}
