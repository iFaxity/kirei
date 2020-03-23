import { CSSResult } from './css';
import { Template, TemplateCache } from './template';


function literal(type: string) {
  // both `html` and `svg` tags have their own cache
  const keyed = new WeakMap<object, Map<any, Function>>();

  function template(strings: TemplateStringsArray, ...values: any[]): Template {
    return new Template(type, strings, values);
  }

  // keyed operations need a reference object, usually the parent node
  // which is showing keyed results, and optionally a unique id per each
  // related node, handy with JSON results and mutable list of objects
  // that usually carry a unique identifier
  template.for = (ref: object, id: any) => {
    let memo = keyed.get(ref);
    if (!memo) {
      memo = new Map();
      keyed.set(ref, memo);
    }

    // keyed operations always re-use the same cache and unroll
    // the template and its interpolations right away
    let res = memo.get(id);
    if (!res) {
      const cache = new TemplateCache();

      res = (strings, ...values) => template(strings, ...values).unroll(cache);
      memo.set(id, res);
    }

    return res;
  };

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

/**
  * Creates a new CSS template
  * @param {TemplateStringsArray} strings
  * @param {*} values
  * @returns {CSSResult}
  */
export const css = (strings: TemplateStringsArray, ...values: readonly unknown[]) => new CSSResult(strings, values);
export const html = literal('html');
export const svg = literal('svg');

type Root = HTMLElement|ShadowRoot|DocumentFragment;
const rendered = new WeakMap<Root, TemplateCache>();

export function render(root: Root, template: Template): void {
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
