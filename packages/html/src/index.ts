import { isFunction } from '@shlim/shared';
import { toRawValue } from '@shlim/fx';
import { Template, TemplateCache } from './template';

export { Template };
export { directive, Directive, DirectiveFactory, DirectiveUpdater } from './directive';

function literal(type: string) {
  // both `html` and `svg` tags have their own cache for keyed renders
  const keyed = new WeakMap<any, Map<any, TemplateCache>>();
  function template(strings: TemplateStringsArray, ...values: any[]): Template {
    return new Template(type, strings, values);
  }

  template.for = mapFor;

  type TemplateFor<T, R> = (item: T, idx: number) => R;
  function mapFor<T>(items: Iterable<T>, key: TemplateFor<T, any>, templateFn?: TemplateFor<T, Template>): (Node|Template)[] {
    let mapFn: (item: T, idx: number) => Node|Template = key;

    // If unkeyed we just map it directly to the template
    if (isFunction(templateFn)) {
      mapFn = (item, idx) => {
        const raw = toRawValue(item);
        let cacheMap = keyed.get(raw);
        if (!cacheMap) {
          cacheMap = new Map();
          keyed.set(raw, cacheMap);
        }
  
        // keyed operations always re-use the same cache and unroll
        // the template and its interpolations right away
        const id = key(item, idx);
        let cache = cacheMap.get(id);
        if (!cache) {
          cache = new TemplateCache();
          cacheMap.set(id, cache);
        }

        return templateFn(item, idx).unroll(cache);
      };
    }

    return Array.from(items).map(mapFn);
  }

  // TODO: maybe use promises in nodeParser instead?
  /*template.until = (...args: unknown[]) => {
    let lastRendered = 0;

    for (let i = 0; i < args.length; i++) {
      const value = args[i];

      if (isPrimitive || isFunction((value as Promise<any>)?.then)) {

      }
      
      Promise.resolve();
    }
  };*/
  return template;
}

export const html = literal('html');
export const svg = literal('svg');

type Root = HTMLElement|ShadowRoot|DocumentFragment;
const rendered = new WeakMap<Root, TemplateCache>();

export function render(template: Template, root: Root): void {
  if (!(template instanceof Template)) {
    throw new TypeError('Template renderer can expects a valid Template as it\'s second argument');
  }

  let cache = rendered.get(root);
  if (!cache) {
    cache = new TemplateCache();
    rendered.set(root, cache);
  }

  const node = template.unroll(cache);
  if (cache.node != node) {
    // Full re-render on root
    cache.node = node;
    while (root.lastChild) {
      root.removeChild(root.lastChild);
    }

    root.appendChild(node.valueOf() as Node);
  }
}
