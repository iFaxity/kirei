import { KireiInstance, KireiElement, HookTypes, CSSResult, defineElement, normalizeOptions, ElementOptions } from '@kirei/element';

/**
 * List of properties to ignore when updating the element options
 * @const {string[]}
 */
const DENY_OPTIONS = [ 'name', 'tag', 'hooks', 'closed' ];

/**
 * Cache for an element and its instances
 * @const {Map<string, HMRCache>}
 */
const hmrCache = new Map<string, HMRCache>();

/**
 * HMR cache item
 * @instance
 */
interface HMRCache {
  /**
   * Element constructor, to modify static options
   * @type {typeof KireiElement}
   */
  ctor: typeof KireiElement;

  /**
   * Active instances with HMR enabled
   * @type {Set<KireiInstance>}
   */
  instances: Set<KireiInstance>;
}

/**
 * Injects a global hook on the element,
 * will last throughout every instances lifecycle
 * @param {typeof KireiElement} ctor
 * @param {string} key
 * @param {Function} fn
 * @returns {void}
 */
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

/**
 * Checks if the styles changed, prevents unnecessary reflow
 * @param {CSSResult[]} oldStyles
 * @param {CSSResult[]} newStyles
 * @returns {boolean}
 */
function stylesChanged(oldStyles: CSSResult[], newStyles: CSSResult[]): boolean {
  if (oldStyles.length != newStyles.length) {
    return true;
  }

  return !oldStyles.every((style, idx) => style.cssText === newStyles[idx].cssText);
}

/**
 * Generates an ID for an element
 * @param {string} filename
 * @param {ElementOptions} opts
 * @returns {string}
 */
function generateId(filename: string, opts: ElementOptions): string {
  return `${filename}#${opts.name}`;
}

/**
 * Checks if HMR already has element with the same id stored
 * @param {string} filename
 * @param {ElementOptions} opts
 * @returns {boolean}
 */
export function has(filename: string, opts: ElementOptions): boolean {
  return hmrCache.has(generateId(filename, opts));
}

/**
 * Stores an Element to cache or updates it and all of its active instances
 * @param {string} id
 * @param {ElementOptions} opts
 * @returns {typeof KireiElement}
 */
export function createOrUpdate(id: string, opts: ElementOptions): typeof KireiElement {
  return has(id, opts) ? update(id, opts) : create(id, opts);
}

/**
 * Solely creates a new element, if element already exists, it will return its constructor
 * @param {string} filename
 * @param {ElementOptions} opts
 * @returns {typeof KireiElement}
 */
export function create(filename: string, opts: ElementOptions): typeof KireiElement {
  const id = generateId(filename, opts);
  const cache = hmrCache.get(id);
  if (cache) {
    return cache.ctor;
  }

  const ctor = defineElement(opts);
  const instances = new Set<KireiInstance>();
  ctor.options.filename = filename;
  hmrCache.set(id, { ctor, instances });

  // Inject lifecycle hooks to track HMR
  injectHook(ctor, HookTypes.BEFORE_MOUNT, function () { instances.add(this); });
  injectHook(ctor, HookTypes.BEFORE_UNMOUNT, function () { instances.delete(this); });
  return ctor;
}

/**
 * Updates element options and all of its instances
 * @param {string} filename
 * @param {ElementOptions} opts
 * @returns {typeof KireiElement}
 */
export function update(filename: string, opts: ElementOptions): typeof KireiElement {
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
