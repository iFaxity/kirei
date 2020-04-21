import parser from 'uparser';
import { persistent, createWalker, createTemplate } from './shared';
import { defaultCompiler, TemplateCompiler, TemplatePatcher } from './compiler';
export { TemplateCompiler };

const TEXT_TAGS = ['style', 'textarea'];
const prefix = 'isµ';
const contentCache = new WeakMap<TemplateStringsArray, TemplateContent>();
const { indexOf } = Array.prototype;

/**
 * TemplateCache
 */
export interface TemplateCache {
  stack: TemplateCache[];
  instance: TemplateInstance;
  node: Node;
}
interface TemplateContent {
  node: HTMLTemplateElement;
  patches: TemplatePatch[];
}
enum PatchType {
  NODE = 'node',
  ATTR = 'attr',
  TEXT = 'text',
}
interface TemplatePatch {
  type: PatchType;
  attr: string;
  path: number[];
}
interface TemplateInstance {
  strings: TemplateStringsArray;
  type: string;
  patchers: TemplatePatcher[];
  root: DocumentFragment;
}

export function createCache(): TemplateCache {
  return { stack: [], instance: null, node: null };
}

function createPatch(node: Node, type: PatchType, attr?: string): TemplatePatch {
  // Track the path up to the root node, essentialy "paving" a path
  const path: number[] = [];
  let parent = node.parentNode;
  while (parent) {
    const i = indexOf.call(parent.childNodes, node);
    path.unshift(i);
    node = parent;
    parent = parent.parentNode;
  }
  return { attr, type, path };
}

function createInstance(template: Template, compiler: TemplateCompiler): TemplateInstance {
  const { strings, type } = template;

  let content = contentCache.get(strings);
  if (!content) {
    contentCache.set(strings, (content = compileContent(type, strings)));
  }

  // TODO: Insert Shadom DOM shim here
  const { patches, node } = content;
  const root = document.importNode(node.content, true);
  const patchers = patches.map(({type, attr, path}) => {
    const node = path.reduce<Node>((n, i) => n.childNodes[i], root) as HTMLElement&Comment&Text;

    // If custom compiler returns with a falsy value (aka not a function)
    return compiler?.[type]?.(node, attr) || defaultCompiler[type](node, attr) as TemplatePatcher;
  });
  return { strings, type, patchers, root };
}

function compileContent(type: string, strings: TemplateStringsArray): TemplateContent {
  // Compile the template element
  const template = createTemplate(type, parser(strings, prefix, type == 'svg'));
  const patches: TemplatePatch[] = [];
  const walker = createWalker(template.content);
  const len = strings.length - 1;
  let i = 0;
  let search = `${prefix}${i}`;

  while (i < len) {
    const node = walker.nextNode();
    if (!node) throw new Error('Parsing error');

    // if the current node is a comment, and it contains isµX
    // it means the update should take care of any content
    if (node.nodeType == Node.COMMENT_NODE) {
      // The only comments to be considered are those
      // which content is exactly the same as the searched one.
      if (node.textContent === search) {
        node.textContent = '';
        patches[i] = createPatch(node, PatchType.NODE);
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
        patches[i] = createPatch(node, PatchType.ATTR, attr);
        search = `${prefix}${++i}`;
      }

      // if the node was a style or a textarea one, check its content
      // and if it is <!--isµX--> then update text-only this node
      if (TEXT_TAGS.includes(el.localName) && node.textContent.trim() === `<!--${search}-->`) {
        node.textContent = '';
        patches[i] = createPatch(node, PatchType.TEXT);
        search = `${prefix}${++i}`;
      }
    }
  }

  return { node: template, patches };
}

export class Template {
  readonly type: string;
  readonly strings: TemplateStringsArray;
  readonly values: any[];

  constructor(type: string, strings: TemplateStringsArray, values: any[]) {
    this.type = type;
    this.strings = strings;
    this.values = values;
  }

  update(cache: TemplateCache, compiler?: TemplateCompiler): Node {
    const { strings, type, values } = this;
    let { instance } = cache;
    updateValues(cache, values, compiler);

    // Create instance if first cache is empty
    // Update instance if templates has changed
    if (!instance || instance.strings !== strings || instance.type !== type) {
      instance = (cache.instance = createInstance(this, compiler));
      cache.node = persistent(instance.root);
    }

    // Update instance values
    const { patchers } = instance;
    for (let i = 0; i < values.length; i++) {
      patchers[i](values[i]);
    }
    return cache.node;
  }
}

function updateValues(cache: TemplateCache, values: any[], compiler: TemplateCompiler): void {
  const { stack } = cache;

  for (let i = 0; i < values.length; i++) {
    const value = values[i];
    let sub: TemplateCache;

    if (value instanceof Template) {
      sub = stack[i] ?? createCache();
      values[i] = value.update(sub, compiler);
    } else if (Array.isArray(value)) {
      sub = stack[i] ?? createCache();
      updateValues(sub, value, compiler);
    }

    stack[i] = sub;
  }

  // This will make sure the stack is fully drained
  if (values.length < stack.length) {
    stack.splice(values.length);
  }
}
