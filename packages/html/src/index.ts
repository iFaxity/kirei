import { Template, TemplateCompiler, TemplateCache, createCache } from './template';
import { isObject } from '@kirei/shared';
export { defaultCompiler, TemplatePatcher } from './compiler';
import { clearNode } from './shared';
export { Template, TemplateCompiler };

type RootContainer = Element|ShadowRoot|DocumentFragment;
const rendered = new WeakMap<RootContainer, TemplateCache>();

const { html, svg, render } = customize();
export { html, svg, render };

type Key = string|number|null|undefined;
export interface TemplateLiteral {
  /**
   * Creates a template from a string literal
   */
  (strings: TemplateStringsArray, ...values: any[]): Template;

  /**
   * Caches a template based on a reference or an unique id.
   * @param {*} ref Reference object to cache for
   * @param {string|number|null|undefined} [key] Unique id for the reference
   * @param {Function} template Template to render from
   */
  key(ref: object, template: Template): Node;
  key(ref: object, key: Key, template: Template): Node;

  // Resolves promises and renders fallback content
  //until(...promises)
}

interface CustomizeOptions<T extends Partial<TemplateLiteral>> {
  compiler?: TemplateCompiler;
  literals?: T;
}

export function customize<T extends TemplateLiteral>(opts: CustomizeOptions<T> = {}) {
  const { compiler } = opts;

  function render(template: Template, root: RootContainer): void {
    if (template instanceof Template) {
      let cache = rendered.get(root);
      if (!cache) {
        rendered.set(root, (cache = createCache()));
      }

      const current = cache.node;
      const node = template.update(cache, compiler);
      if (current !== node) {
        clearNode(root);
        root.appendChild(node.valueOf() as Node);
      }
    } else if (template == null) {
      const cache = rendered.get(root);

      // Cleanup root and clear cache
      if (cache) {
        clearNode(root);
        cache.node = null;
      }
    } else {
      throw new TypeError('Template renderer can expects a valid Template as it\'s first argument');
    }
  }

  return {
    /**
     * Renders a template to a specific root container
     * @param {Template} template
     * @param {HTMLElement|ShadowRoot|DocumentFragment} root
     */
    render,
    /**
     * Creates a template with html content
     */
    html: createLiteral<T>('html', opts),
    /**
     * Creates a template with svg content
     */
    svg: createLiteral<T>('svg', opts),
  }
}

function createLiteral<T extends TemplateLiteral>(
  type: string,
  opts: CustomizeOptions<T>
): T {
  const { compiler, literals } = opts;

  // Every literal has its own cache for keyed templates
  const keyed = new WeakMap<any, Map<any, TemplateCache>>();
  const template: TemplateLiteral = (strings: TemplateStringsArray, ...values: any[]): Template => {
    return new Template(type, strings, values);
  };

  template.key = (ref: object, key: Key|Template, template?: Template): Node => {
    // Key is optional as we can key by the reference object
    if (!template) {
      template = key as Template;
      key = void 0;
    }

    let memo = keyed.get(ref);
    if (!memo) {
      keyed.set(ref, (memo = new Map()));
    }

    // keyed operations always re-use the same cache and unroll
    // the template and its interpolations right away
    let cache = memo.get(key);
    if (!cache) {
      memo.set(key, (cache = createCache()))
    }

    // Update template and return the cached node
    return template.update(cache, compiler);
  };

  // Add extension methods to literal
  if (isObject(literals)) {
    for (let key of Object.keys(literals)) {
      if (key in template) {
        throw new Error('Cannot override properties in literals');
      }

      template[key] = literals[key];
    }
  }

  return template as T;
}
