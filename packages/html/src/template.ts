import { isFunction } from '@shlim/shared';
import parser from 'uparser';
import { persistent, createWalker } from './shared';
import { defaultCompiler, TemplateCompiler, TemplatePatcher } from './compiler';
export { TemplateCompiler };

const TEXT_TAGS = ['style', 'textarea'];
const prefix = 'isµ';
const contentCache = new WeakMap<TemplateStringsArray, TemplateContent>();

/**
 * TemplateCache
 */
export class TemplateCache {
  stack: TemplateCache[] = [];
  instance: TemplateInstance = null;
  node: Node = null; // resulting fragment
}

interface TemplateContent {
  element: HTMLTemplateElement;
  patches: TemplatePatch[];
}

enum PatchType {
  NODE = 'node',
  ATTR = 'attr',
  TEXT = 'text',
}

interface TemplatePatch {
  readonly type: PatchType;
  readonly name: string;
  readonly path: number[];
}

/**
 * TemplatePatch
 */
function createPatch(type: PatchType, node: Node, name: string = null): TemplatePatch {
  const path: number[] = [];

  // Track the path up to the root node, essentialy "paving" a path
  let parent = node.parentNode;
  while (parent) {
    const idx = Array.prototype.indexOf.call(parent.childNodes, node);
    path.unshift(idx);
    [node, parent] = [parent, parent.parentNode];
  }
  return { name, type, path };
}

function compilePatch(patch: TemplatePatch, instance: TemplateInstance): TemplatePatcher {
  const { type, name, path } = patch;
  const { root, compiler } = instance;
  const node = path.reduce<Node>((n, i) => n.childNodes[i], root);
  const args: any[] = [ node ];

  if (type == PatchType.ATTR) {
    args.push(name);
  }

  // If custom compiler function is defined, use it
  // If custom compiler returns with null/undefined, use default compiler
  const patcher = compiler?.[type];
  if (isFunction(patcher)) {
    const res = patcher.apply(null, args);
    if (res != null) return res;
  }

  return defaultCompiler[type].apply(null, args);
}

/**
 * Instance
 */
interface TemplateInstance {
  root: DocumentFragment;
  wire: Node;
  compiler: TemplateCompiler;
  template: Template;
  patchers: TemplatePatcher[];
}

function compileInstance(template: Template): TemplateContent {
  const { strings, type } = template;
  const element = document.createElement('template');
  element.innerHTML = parser(strings, prefix, type == 'svg');

  // Compile the template element
  const patches: TemplatePatch[] = [];
  const walker = createWalker(element.content);
  const len = template.strings.length - 1;
  let i = 0;
  let search = `${prefix}${i}`;

  while (i < len) {
    const node = walker.nextNode();
    if (!node) throw new Error('Parsing error');

    const text = node.textContent;
    // if the current node is a comment, and it contains isµX
    // it means the update should take care of any content
    if (node.nodeType == Node.COMMENT_NODE) {
      // The only comments to be considered are those
      // which content is exactly the same as the searched one.
      if (text === search) {
        node.textContent = '';
        patches.push(createPatch(PatchType.NODE, node));
        search = `${prefix}${++i}`;
      }
    } else {
      const el = node as Element;

      // if the node is not a comment, loop through all its attributes
      // named isµX and relate attribute updates to this node and the
      // attribute name, retrieved through node.getAttribute("isµX")
      // the isµX attribute will be removed as irrelevant for the layout
      let attr: string;
      while ((attr = el.getAttribute(search))) {
        el.removeAttribute(search);
        patches.push(createPatch(PatchType.ATTR, node, attr));
        search = `${prefix}${++i}`;
      }
      // if the node was a style or a textarea one, check its content
      // and if it is <!--isµX--> then update tex-only this node
      // if the node was a style or a textarea one, check its content
      // and if it is <!--isµX--> then update text-only this node
      if (TEXT_TAGS.includes(el.localName) && text.trim() === `<!--${search}-->`) {
        node.textContent = '';
        patches.push(createPatch(PatchType.TEXT, node));
        search = `${prefix}${++i}`;
      }
    }
  }

  return { element, patches };
}

function createInstance(template: Template, compiler: TemplateCompiler): TemplateInstance {
  return updateInstance({
    root: null, wire: null, patchers: null, template: null, compiler
  }, template);
}

function updateInstance(instance: TemplateInstance, template: Template): TemplateInstance {
  let node = contentCache.get(template.strings);
  if (!node) {
    contentCache.set(template.strings, (node = compileInstance(template)));
  }

  instance.template = template;
  instance.root = document.importNode(node.element.content, true);
  instance.patchers = node.patches.map(patch => compilePatch(patch, instance));
  return instance;
}

/**
 * Template
 */
export class Template {
  readonly type: string;
  readonly strings: TemplateStringsArray;
  readonly values: any[];

  constructor(type: string, strings: TemplateStringsArray, values: any[]) {
    this.type = type;
    this.strings = strings;
    this.values = values;
  }
}

function unrollValues(cache: TemplateCache, values: any[], compiler: TemplateCompiler): void {
  const { stack } = cache;

  for (let idx = 0; idx < values.length; idx++) {
    const value = values[idx];
    let nodeCache: TemplateCache = null;

    if (value instanceof Template) {
      nodeCache = stack[idx] ?? new TemplateCache();
      values[idx] = unroll(value, nodeCache, compiler);
    } else if (Array.isArray(value)) {
      nodeCache = stack[idx] ?? new TemplateCache();
      unrollValues(nodeCache, value, compiler);
    }

    stack[idx] = nodeCache;
  }

  // This will make sure the stack is fully drained
  if (values.length < stack.length) {
    stack.splice(values.length);
  }
}

export function unroll(template: Template, cache: TemplateCache, compiler?: TemplateCompiler): Node {
  const { values } = template;
  let { instance } = cache;
  unrollValues(cache, values, compiler);

  // create new template instance if template differs
  // update template instance if it differs
  if (!instance) {
    instance = cache.instance = createInstance(template, compiler);
  } else if (
    template.strings !== instance.template.strings &&
    template.type === instance.template.type
  ) {
    updateInstance(instance, template);
  }

  // Render or update the instance
  const { patchers, root } = instance;
  for (let idx = 0; idx < values.length; idx++) {
    patchers[idx](values[idx]);
  }

  // Create wire node if it doesn't exist
  if (!instance.wire) {
    instance.wire = persistent(root);
  }
  return instance.wire;
}
