import parser from 'uparser';
import { persistent, createWalker } from './shared';
import { nodeParser, textParser, attrParser } from './parser';

// Required for ShadyDOM shims to work
const TEXT_TAGS = ['style', 'textarea'];
const prefix = 'isµ';
const contentCache = new WeakMap<TemplateStringsArray, TemplateContent>();

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

type TemplatePatcher = (newValue: unknown) => void;
class TemplatePatch {
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

  compile(instance: TemplateInstance): TemplatePatcher {
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
  patches: TemplatePatch[];
}

export class TemplateInstance {
  readonly patchers: TemplatePatcher[];
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
    const res = {
      template: template.element,
      patches: [],
    } as TemplateContent;
    const walker = createWalker(res.template.content);
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
          res.patches.push(new TemplatePatch(PatchType.NODE, node));
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
          res.patches.push(new TemplatePatch(PatchType.ATTR, node, attr));
          search = `${prefix}${++i}`;
        }
        // if the node was a style or a textarea one, check its content
        // and if it is <!--isµX--> then update tex-only this node
        // if the node was a style or a textarea one, check its content
        // and if it is <!--isµX--> then update text-only this node
        if (TEXT_TAGS.includes(el.localName) && text.trim() === `<!--${search}-->`) {
          node.textContent = '';
          res.patches.push(new TemplatePatch(PatchType.TEXT, node));
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

    // Create wire node if it doesn't exist
    if (!this.wire) {
      this.wire = persistent(this.root);
    }
    return this.wire;
  }
}

export class Template {
  readonly type: string;
  readonly strings: TemplateStringsArray;
  readonly values: any[];

  // Creates a template element for this element
  get element(): HTMLTemplateElement {
    const template = document.createElement('template');
    template.innerHTML = parser(this.strings, prefix, this.type == 'svg');
    return template;
  }

  constructor(type: string, strings: TemplateStringsArray, values: any[]) {
    this.type = type;
    this.strings = strings;
    this.values = values;
  }

  unroll(cache: TemplateCache) {
    const instance = cache.instance;
    this.unrollValues(cache, this.values);

    if (!instance || !this.equals(instance.template)) {
      // create new template instance if template differs
      cache.instance = new TemplateInstance(this);
    }

    return cache.instance.render(this.values);
  }

  protected unrollValues(cache: TemplateCache, values: any[]): TemplateCache {
    const { stack } = cache;

    // This will make sure the stack is fully drained
    cache.stack = values.map((value, idx) => {
      let cache = stack[idx];
      if (value instanceof Template) {
        cache = cache ?? new TemplateCache();
        values[idx] = value.unroll(cache);
        return cache;
      } else if (Array.isArray(value)) {
        cache = cache ?? new TemplateCache();
        return this.unrollValues(cache, value);
      }

      return null;
    });
    return cache;
  }

  equals(other: Template): boolean {
    return other.strings === this.strings || other.type === this.type;
  }
}
