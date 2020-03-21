import umap from 'umap';
import {Hole, createCache, unroll} from './rabbit.js';

// both `html` and `svg` template literal tags are polluted
// with a `for(ref[, id])` and a `node` tag too
const createTag = type => {
  // both `html` and `svg` tags have their own cache
  const keyed = umap(new WeakMap);
  // keyed operations always re-use the same cache and unroll
  // the template and its interpolations right away
  const fixed = cache => (template, ...values) => unroll(
    cache,
    {type, template, values}
  );

  function template(template, ...values) {
    return new Hole(type, template, values);
  }

  // keyed operations need a reference object, usually the parent node
  // which is showing keyed results, and optionally a unique id per each
  // related node, handy with JSON results and mutable list of objects
  // that usually carry a unique identifier
  template.for = (ref, id) => {
    const memo = keyed.get(ref) || keyed.set(ref, Object.create(null));
    return memo[id] || (memo[id] = fixed(createCache()));
  };
  // it is possible to create one-off content out of the box via node tag
  // this might return the single created node, or a fragment with all
  // nodes present at the root level and, of course, their child nodes
  template.value = (template, ...values) => {
    const cache = createCache();
    return unroll(cache, { type, template, values }).valueOf();
  };

  return template;
};

// each rendered node gets its own cache
const rendered = umap(new WeakMap);
export const html = tag('html');
export const svg = tag('svg');

// rendering means understanding what `html` or `svg` tags returned
// and it relates a specific node to its own unique cache.
// Each time the content to render changes, the node is cleaned up
// and the new new content is appended, and if such content is a Hole
// then it's "unrolled" to resolve all its inner nodes.
export const render = (where, what) => {
  const hole = typeof what === 'function' ? what() : what;
  const info = rendered.get(where) || rendered.set(where, createCache());
  const wire = hole instanceof Hole ? unroll(info, hole) : hole;
  if (wire !== info.wire) {
    info.wire = wire;
    where.textContent = '';
    // valueOf() simply returns the node itself, but in case it was a "wire"
    // it will eventually re-append all nodes to its fragment so that such
    // fragment can be re-appended many times in a meaningful way
    // (wires are basically persistent fragments facades with special behavior)
    where.appendChild(wire.valueOf());
  }
  return where;
};
