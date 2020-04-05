import { Template, TemplateCompiler, TemplateCache, unroll } from './template';
import { isFunction, isObject } from '@shlim/shared';
export { defaultCompiler, TemplatePatcher } from './compiler';
export { Template, TemplateCompiler };

type RootContainer = Element|ShadowRoot|DocumentFragment;
const rendered = new WeakMap<RootContainer, TemplateCache>();

const { html, svg, render } = customize();
export { html, svg, render };


type TemplateFor<T, R> = (item: T, idx: number) => R;
export interface TemplateLiteral {
  (strings: TemplateStringsArray, ...values: any[]): Template;
  /**
   * 
   * @param items 
   * @param key 
   * @param templateFn 
   */
  for<T>(
    items: Iterable<T>,
    key: TemplateFor<T, any>,
    templateFn?: TemplateFor<T, Template>
  ): (Node|Template)[];

  // Resolves promises and renders fallback content
  //until(...promises)

  /**
   * Portals content to a specified target
   * @param {string} target Target element as a querySelector string
   * @param {Template} template Template to render
   * @returns {void}
   */
  portal(target: string, template: Template): void;
}

interface CustomizeOptions<T extends Partial<TemplateLiteral>> {
  compiler?: TemplateCompiler,
  literals?: T,
}

export function customize<T extends TemplateLiteral>(opts: CustomizeOptions<T> = {}) {
  const { compiler } = opts;

  /**
   * Renders a template to a specific root container
   * @param {Template} template
   * @param {HTMLElement|ShadowRoot|DocumentFragment} root
   */
  function render(template: Template, root: RootContainer): void {
    if (!(template instanceof Template)) {
      throw new TypeError('Template renderer can expects a valid Template as it\'s second argument');
    }

    let cache = rendered.get(root);
    if (!cache) {
      rendered.set(root, (cache = new TemplateCache()));
    }

    const node = unroll(template, cache, compiler);
    if (cache.node != node) {
      cache.node = node;

      // innerHTMl is faster, but doesn't work for DocumentFragments
      if ('innerHTML' in root) {
        root.innerHTML = '';
      } else {
        while (root.lastChild) {
          root.removeChild(root.lastChild);
        }
      }

      root.appendChild(node.valueOf() as Node);
    }
  }

  return {
    render,
    /**
     * Creates a template with html content
     */
    html: createLiteral<T>('html', render, opts),
    /**
     * Creates a template with svg content
     */
    svg: createLiteral<T>('svg', render, opts),
  }
}

function createLiteral<T extends TemplateLiteral>(
  type: string,
  render: (template: Template, root: RootContainer) => void,
  opts: CustomizeOptions<T>
): T {
  const { compiler, literals } = opts;

  // both `html` and `svg` tags have their own cache for keyed renders
  const keyed = new WeakMap<any, Map<any, TemplateCache>>();
  function template(strings: TemplateStringsArray, ...values: any[]): Template {
    return new Template(type, strings, values);
  }

  template.for = function mapFor<T>(items: T[], key: TemplateFor<T, any>, templateFn?: TemplateFor<T, Template>): (Node|Template)[] {
    if (!isFunction(templateFn)) {
      // run as unkeyed (key is templateFn)
      return items.map(key);
    }

    // keyed, we map by a unique ID
    return items.map((item, idx) => {
      let cacheMap = keyed.get(item);
      if (!cacheMap) {
        keyed.set(item, (cacheMap = new Map()));
      }

      // keyed operations always re-use the same cache and unroll
      // the template and its interpolations right away
      const id = key(item, idx);
      let cache = cacheMap.get(id);
      if (!cache) {
        cacheMap.set(id, (cache = new TemplateCache()));
      }
      return unroll(templateFn(item, idx), cache, compiler);
    });
  }

  const portalTargets = new Map<string, Element>();
  template.portal = (target: string, template: Template) => {
    let root = portalTargets.get(target);
    if (!root) {
      portalTargets.set(target, (root = document.querySelector(target)));
    }

    render(template, root);
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
