import { isFunction } from '@shlim/shared';
import { Template, TemplateCache } from './template';
import { TemplateCompiler } from './compiler';

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

export function createLiteral(type: string, compiler?: TemplateCompiler, unpack?: (target: any) => any): TemplateLiteral {
  // both `html` and `svg` tags have their own cache for keyed renders
  const keyed = new WeakMap<any, Map<any, TemplateCache>>();
  function template(strings: TemplateStringsArray, ...values: any[]): Template {
    return new Template(type, strings, values, compiler);
  }

  template.for = function mapFor<T>(items: Iterable<T>, key: TemplateFor<T, any>, templateFn?: TemplateFor<T, Template>): (Node|Template)[] {
    let mapFn: (item: T, idx: number) => Node|Template = key;

    // If unkeyed we just map it directly to the template
    if (isFunction(templateFn)) {
      mapFn = (item, idx) => {
        // Unpack value if needed
        const raw = unpack ? unpack(item) : item;
        let cacheMap = keyed.get(raw);
        if (!cacheMap) {
          keyed.set(raw, (cacheMap = new Map()));
        }

        // keyed operations always re-use the same cache and unroll
        // the template and its interpolations right away
        const id = key(item, idx);
        let cache = cacheMap.get(id);
        if (!cache) {
          cacheMap.set(id, (cache = new TemplateCache()));
        }

        return templateFn(item, idx).unroll(cache);
      };
    };

    return Array.from(items).map(mapFn);
  }
  return template;
}
