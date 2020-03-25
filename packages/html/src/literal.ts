import { isFunction } from '@shlim/shared';
import { toRawValue } from '@shlim/fx';
import { Template, TemplateCache } from './template';

type TemplateFor<T, R> = (item: T, idx: number) => R;
export interface TemplateLiteral {
  (strings: TemplateStringsArray, ...values: any[]): Template;
  for<T>(
    items: Iterable<T>,
    key: TemplateFor<T, any>,
    templateFn?: TemplateFor<T, Template>
  ): (Node|Template)[];

  // TODO: maybe use promises in nodeParser instead?
  //until(...)
}

export function createLiteral(type: string): TemplateLiteral {
  // both `html` and `svg` tags have their own cache for keyed renders
  const keyed = new WeakMap<any, Map<any, TemplateCache>>();
  function template(strings: TemplateStringsArray, ...values: any[]): Template {
    return new Template(type, strings, values);
  }

  template.for = function mapFor<T>(items: Iterable<T>, key: TemplateFor<T, any>, templateFn?: TemplateFor<T, Template>): (Node|Template)[] {
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
    };

    return Array.from(items).map(mapFn);
  }
  return template;
}
