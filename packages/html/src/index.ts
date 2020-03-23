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

  return template;
}

export const html = literal('html');
export const svg = literal('svg');

const rendered = new WeakMap<Element, TemplateCache>();

function clearChildren(node: Node) {
  while (node.lastChild) {
    node.removeChild(node.lastChild);
  }
}

export function render(root: Element, template: Template): void {
  let cache = rendered.get(root);

  if (!cache) {
    cache = new TemplateCache();
    rendered.set(root, cache);
  }

  const node = template.unroll(cache);

  if (cache.node != node) {
    clearChildren(root);

    //@ts-ignore
    root.appendChild(node.valueOf());
  }
}

//@ts-ignore
window.render = render;
//@ts-ignore
window.html = html;
//@ts-ignore
window.svg = svg;
