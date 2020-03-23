import parser from 'uparser';
import { persistent } from './shared';
//import createContent from '@ungap/create-content';
import { nodeParser, textParser, attrParser } from './parser';

// Required for ShadyDOM shims to work
const prefix = 'isµ';
const contentCache = new WeakMap<TemplateStringsArray, TemplateContent>();

// this "hack" tells the library if the browser is IE11 or old Edge
const IE = document.importNode.length != 1;

// IE11 and old Edge discard empty nodes when cloning, potentially
// resulting in broken paths to find updates. The workaround here
// is to import once, upfront, the fragment that will be cloned
// later on, so that paths are retrieved from one already parsed,
// hence without missing child nodes once re-cloned.
/*export const createFragment = IE
  ? (text, type) => document.importNode(createContent(text, type), true)
  : createContent;*/

// IE11 and old Edge have a different createTreeWalker signature that
// has been deprecated in other browsers. This export is needed only
// to guarantee the TreeWalker doesn't show warnings and, ultimately, works
const filter = NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT;
export const createWalker = IE
  ? node => document.createTreeWalker(node, filter, null, false)
  : node => document.createTreeWalker(node, filter);

export class TemplateCache {
  stack: any[] = [];
  instance: TemplateInstance = null;
  node: any = null; // resulting fragment
}

enum PatchType {
  NODE,
  ATTR,
  TEXT,
}

type Patcher = (newValue: unknown) => void;

class Patch {
  static textTags = ['style', 'textarea'];
  readonly type: PatchType;
  readonly name: string;
  readonly path: number[] = [];
  readonly parser: (newValue: unknown) => void;

  constructor(type: number, node: Node, name: string = null) {
    this.type = type;
    this.name = name;

    // Track the path up to the root node, essentialy "paving" a path
    let parent = node.parentNode;
    while (parent) {
      const idx = Array.prototype.indexOf.call(parent.childNodes, node);
      this.path.unshift(idx);
      [node, parent] = [parent, parent.parentNode];
    }
  }

  compile(instance: TemplateInstance): Patcher {
    const node = this.path.reduce<Node>((n, i) => n.childNodes[i], instance.root);

    if (this.type == PatchType.ATTR) {
      return attrParser(node as Element, this.name);
    } else if (this.type == PatchType.TEXT) {
      return textParser(node as Text);
    }
    return nodeParser(node as Comment);
  }
}

interface TemplateContent {
  template: HTMLTemplateElement;
  patches: Patch[];
}

export class TemplateInstance {
  readonly patchers: Patcher[];
  readonly root: DocumentFragment;
  readonly template: Template;
  private wire: Node = null;

  constructor(template: Template) {
    let node = contentCache.get(template.strings);

    if (!node) {
      node = this.compile(template);
      contentCache.set(template.strings, node);
    }

    this.template = template;
    this.root = document.importNode(node.template.content, true);
    this.patchers = node.patches.map(patch => patch.compile(this));
  }

  // Compile the template node, mapTemplate
  protected compile(template: Template): TemplateContent {
    // Compile the template element
    const { strings, type } = template;
    const res = {
      template: document.createElement('template'),
      patches: [],
    } as TemplateContent;
    res.template.innerHTML = parser(strings, prefix, type == 'svg');

    const walker = createWalker(res.template.content);
    const len = strings.length - 1;
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
          res.patches.push(new Patch(PatchType.NODE, node));
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
          res.patches.push(new Patch(PatchType.ATTR, node, attr));
          search = `${prefix}${++i}`;
        }
        // if the node was a style or a textarea one, check its content
        // and if it is <!--isµX--> then update tex-only this node
        // if the node was a style or a textarea one, check its content
        // and if it is <!--isµX--> then update text-only this node
        const patchText = Patch.textTags.includes(el.tagName.toLowerCase());
        if (patchText && text.trim() === `<!--${search}-->`) {
          res.patches.push(new Patch(PatchType.TEXT, node));
          search = `${prefix}${++i}`;
        }
      }
    }

    return res;
  }

  render(values: any[]): Node {
    for (let idx = 0; idx < values.length; idx++) {
      this.patchers[idx](values[idx]);
    }

    // Create wire if it doesn't exist
    if (!this.wire) {
      this.wire = persistent(this.root);
    }
    return this.wire;
  }
}

// Hole
export class Template {
  readonly type: string;
  readonly strings: TemplateStringsArray;
  readonly values: any[];

  constructor(type: string, strings: TemplateStringsArray, values: any[]) {
    this.type = type;
    this.strings = strings;
    this.values = values;
  }

  unroll(cache?: TemplateCache) {
    cache = cache ?? new TemplateCache();
    Template.unrollValues(cache, this.values);

    const other = cache.instance;
    if (!other || !this.equals(other.template)) {
      // create new template instance
      cache.instance = new TemplateInstance(this);
    }

    return cache.instance.render(this.values);
  }

  protected static unrollValues(cache: TemplateCache, values: any[]) {
    let { stack } = cache;

    for (let i = 0; i < values.length; i++) {
      const value = values[i];

      if (value instanceof Template) {
        values[i] = value.unroll(stack[i] ?? (stack[i] = new TemplateCache()));
      } else if (Array.isArray(value)) {
        this.unrollValues(stack[i] ?? (stack[i] = new TemplateCache()), value);
      } else {
        stack[i] = null;
      }
    }

    // Drain the last items in the stack
    // TODO: this look redundant, might be GC voodoo
    if (values.length < stack.length) {
      stack = stack.slice(0, length);
      stack.splice(length);
    }
  }

  equals(other: Template): boolean {
    return other.strings === this.strings || other.type === this.type;
  }
}


// Template.content and template.updates are cached

// cache = TemplateCache
// entry = TemplateInstance
// hole = Template

// createCache() = new TemplateCache()
// createEntry(type, template) = Template
// mapTemplate(type, template) = Template.compile
// unroll(info, Hole) = Template.unroll
// unrollValues(info, values, length) = Template.unrollValues
// new Hole(type, template, values) = new Template(type, strings, values)
