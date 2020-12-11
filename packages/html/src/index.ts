import { Template, createCache } from './template';
import type { TemplateCompiler, TemplateCache } from './template';
import { isObject } from '@kirei/shared';
import { clearNode } from './shared';
export { defaultCompiler } from './compiler';

export { Template, createCache } from './template';
export type { TemplateCompiler } from './template';
export { LRUWeakMap } from './shared';
export type { TemplatePatcher } from './compiler';

type Key = string|number|null|undefined;
type RootContainer = Element|ShadowRoot|DocumentFragment;

const rendered = new WeakMap<RootContainer, TemplateCache>();

const { html, svg, render } = customize({});
export { html, svg, render };

interface RenderOptions {
  scopeName?: string;
  mount?: boolean;
}

/**
 * Template literal to template markup with interpolated values.
 * Also has literals as static members as utility functions.
 */
export interface TemplateLiteral {
  /**
   * Creates a template from a string literal
   * @param strings - String glue
   * @param values - Interpolated string values
   * @returns A template class
   */
  (strings: TemplateStringsArray, ...values: any[]): Template;

  /**
   * Caches a template based on a reference or an unique id.
   * @param ref - Reference object to cache for
   * @param  key - Unique id for the reference
   * @param template - Template to render
   * @returns The keyed node
   */
  key(ref: object, template: Template): Node;
  key(ref: object, key: Key, template: Template): Node;

  // Resolves promises and renders fallback content
  // todo maybe create something else for this, using slots perhaps
  //until(...promises)
}

/**
 * Custom compiler options
 */
interface CompilerOptions<T extends Partial<TemplateLiteral>> {
  /**
   * Custom compiler to use instead of the default,
   * will fallback to defaults if compiler does not implement all the members
   */
  compiler?: TemplateCompiler;

  /**
   * Literals to assign to the returned TemplateLiteral as static members
   */
  literals?: T;
}

/**
 * Template renderer object
 */
interface TemplateRenderer<T extends TemplateLiteral> {
  /**
   * Creates a template with html content
   */
  html: T;

  /**
   * Creates a template with svg content
   */
  svg: T;

  /**
   * Renders a template to a specific root container
   * @param template - Template or Node to render from
   * @param root - Root node to render content to
   * @param opts Custom render options, not rquired but used for web components shims
   * @returns Rendered node
   */
  render(template: Template|Node, root: RootContainer, opts?: RenderOptions): Node;
  render(template: null, root: RootContainer, opts?: RenderOptions): void;
  render(template: Template|Node|null, root: RootContainer, opts?: RenderOptions): Node|null;
}

/**
 * Customizes a template rendered to define a compiler and static literals
 * @param opts - Custom compiler options
 * @returns
 */
export function customize<T extends TemplateLiteral>(opts: CompilerOptions<T>): TemplateRenderer<T> {
  const { compiler } = opts;
  return {
    html: createLiteral('html', opts),
    svg: createLiteral('svg', opts),
    render(template: Template|Node, root: RootContainer, renderOptions: RenderOptions = {}) {
      const { scopeName, mount } = renderOptions;
      let cache = rendered.get(root);

      if (template != null) {
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

        if (!root.childNodes.length || wire !== node) {
          // if mount is set and false, dont mount
          if (mount == null || mount) {
            clearNode(root);
            root.appendChild(node.valueOf() as Node);
          }
        }

        return node;
      }

      // Cleanup root and clear cache
      if (cache) {
        clearNode(root);
        cache.node = null;
      }
    },
  }
}

/**
 * Creates a new template literal function
 * @param type - Template type, either "html" or "svg"
 * @param opts - Custom compiler options to use when compiling a template
 * @returns A created template literal function
 * @private
 */
function createLiteral<T extends TemplateLiteral>(type: 'html'|'svg', opts: CompilerOptions<T>): T {
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
