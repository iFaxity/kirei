import { Template, TemplateCache } from './template';
import { createLiteral } from './literal';

export { Template };
export { directive, Directive, DirectiveFactory, DirectiveUpdater } from './directive';

type RootContainer = HTMLElement|ShadowRoot|DocumentFragment;
const rendered = new WeakMap<RootContainer, TemplateCache>();

export const html = createLiteral('html');
export const svg = createLiteral('svg');

/**
 * Renders a template to a specific root container
 * @param {Template} template
 * @param {HTMLElement|ShadowRoot|DocumentFragment} root
 */
export function render(template: Template, root: RootContainer): void {
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
