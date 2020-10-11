import { Template, createCache } from './template';
import type { TemplateCompiler, TemplateCache } from './template';
import { isObject } from '@kirei/shared';
import { clearNode } from './shared';
export { defaultCompiler } from './compiler';

export { Template, createCache } from './template';
export type { TemplateCompiler } from './template';
export { LRUWeakMap } from './shared';
export type { TemplatePatcher } from './compiler';

/** @type */
type Key = string|number|null|undefined;

/** @type */
type RootContainer = Element|ShadowRoot|DocumentFragment;

/** @const */
const rendered = new WeakMap<RootContainer, TemplateCache>();

const { html, svg, render } = customize();
export { html, svg, render };

/**
 * Template literal to template markup with interpolated values.
 * Also has literals as static members as utility functions
 * @interface
 */
export interface TemplateLiteral {
  /**
   * Creates a template from a string literal
   * @param {TemplateStringsArray} strings
   * @param {...any} values
   * @returns {Template}
   */
  (strings: TemplateStringsArray, ...values: any[]): Template;

  /**
   * Caches a template based on a reference or an unique id.
   * @param {*} ref Reference object to cache for
   * @param {string|number|null|undefined} [key] Unique id for the reference
   * @param {Function} template Template to render
   */
  key(ref: object, template: Template): Node;
  key(ref: object, key: Key, template: Template): Node;

  // Resolves promises and renders fallback content
  // todo maybe create something else for this, using slots perhaps
  //until(...promises)
}

/**
 * 
 * @interface
 */
interface CustomizeOptions<T extends Partial<TemplateLiteral>> {
  /**
   * Custom compiler to use instead of the default,
   * will fallback to defaults if compiler does not implement all the members
   * @type {TemplateCompiler}
   */
  compiler?: TemplateCompiler;

  /**
   * Literals to assign to the returned TemplateLiteral as static members
   * @type {T}
   */
  literals?: T;
}

/**
 * 
 * @interface
 */
interface TemplateRenderer<T extends TemplateLiteral> {
  /**
   * Creates a template with html content
   * @var {T}
   */
  html: T;

  /**
   * Creates a template with svg content
   * @var {T}
   */
  svg: T;

  /**
   * Renders a template to a specific root container
   * @param {Template|Node} template Template or Node to render from
   * @param {Element|ShadowRoot|DocumentFragment} root Root node to render content to
   * @param {string} [scopeName] The custom element tag name, only used for webcomponents shims
   * @returns {void}
   */
  render(template: Template|Node, root: RootContainer, scopeName?: string): void;
}

/**
 * Customizes a template rendered to define a compiler and static literals
 * @param {CustomizeOptions<T>} opts
 * @returns
 */
export function customize<T extends TemplateLiteral>(opts: CustomizeOptions<T> = {}): TemplateRenderer<T> {
  const { compiler } = opts;
  return {
    html: createLiteral('html', opts),
    svg: createLiteral('svg', opts),
    render(template, root, scopeName) {
      if (template != null) {
        let cache = rendered.get(root);
        if (!cache) {
          rendered.set(root, (cache = createCache()));
        }

        const wire = cache.node;
        let node: Node;
        if (template instanceof Template) {
          node = template.update(cache, compiler, scopeName);
        } else if (template instanceof Node) {
          node = template;
        } else {
          throw new TypeError('Invalid render template, expected Template or Node');
        }

        if (wire !== node) {
          clearNode(root);
          root.appendChild(node.valueOf() as Node);
        }
      } else {
        const cache = rendered.get(root);

        // Cleanup root and clear cache
        if (cache) {
          clearNode(root);
          cache.node = null;
        }
      }
    },
  }
}

/**
 * @param {string} type
 * @param {CustomizeOptions<T>} opts
 * @returns {T}
 * @private
 */
function createLiteral<T extends TemplateLiteral>(
  type: string,
  opts: CustomizeOptions<T>
): T {
  const { compiler, literals } = opts;

  // Every literal has its own cache for keyed templates
  const keyed = new WeakMap<any, Map<any, TemplateCache>>();
  const template: TemplateLiteral = (strings, ...values) => new Template(type, strings, values);

  template.key = (ref: object, key: Key|Template, template?: Template) => {
    // Key is optional as we can key by the reference object
    if (!template) {
      template = key as Template;
      key = void 0;
    }

    let memo = keyed.get(ref);
    if (!memo) {
      keyed.set(ref, memo = new Map());
    }

    // keyed operations always re-use the same cache
    let cache = memo.get(key);
    if (!cache) {
      memo.set(key, cache = createCache());
    }

    // Update template and return the cached node
    return template.update(cache, compiler);
  };

  // Add extension methods to literal
  if (isObject(literals)) {
    for (let key of Object.keys(literals)) {
      if (key in template) {
        throw new TypeError('Cannot override properties in literals');
      }

      template[key] = literals[key];
    }
  }

  return template as T;
}
