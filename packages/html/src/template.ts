import sanitize from 'uparser';
import { persistent, createWalker, createTemplate, LRUWeakMap } from './shared';
import { defaultCompiler, TemplateCompiler, TemplatePatcher, PatchType } from './compiler';
export { TemplateCompiler };

/**
 * Tags to force text only from node content
 * @const
 */
const TEXT_TAGS = ['style', 'textarea'];

/**
 * Prefix to glue template strings by the interpolated value slot
 * @const
 */
const PREFIX = 'isµ';

/**
 * Cache to store precompiled templates indexed by the template strings
 * as a LRUCache it only stores the most recently 'X' used elements.
 * Effectively trading memory for performance and performance for memory.
 * @const
 */
const contentCache = new LRUWeakMap<TemplateStringsArray, TemplateContent>(500);

/**
 * Template cache, used with template to remember past renders
 * @interface
 */
export interface TemplateCache {
  stack: TemplateCache[];
  instance: TemplateInstance;
  node: Node;
}

/**
 * Compiled template from strings and patcher function
 * @interface
 */
interface TemplateContent {
  node: HTMLTemplateElement;
  patches: TemplatePatch[];
}

/**
 * Patch information for TemplatePatcher node traversal
 * @interface
 */
interface TemplatePatch {
  type: PatchType;
  attr: string;
  path: number[];
}

/**
 * 
 * @interface
 */
interface TemplateInstance {
  strings: TemplateStringsArray;
  type: string;
  patchers: TemplatePatcher[];
  root: DocumentFragment;
}

/**
 * Creates an empty template cache instance
 * @returns {TemplateCache}
 * @private
 */
export function createCache(): TemplateCache {
  return { stack: [], instance: null, node: null };
}

/**
 * Creates a patch walker for a node
 * @param {Node} node Node to create patch for
 * @param {PatchType} type patch type
 * @param {string} attr Attribute name (only if type is PatchType.Attr)
 * @param {TemplatePatch}
 */
function createPatch(node: Node, type: PatchType, attr?: string): TemplatePatch {
  // Index the node relative to the root, essentialy "paving" a path
  const path: number[] = [];
  while (node.parentNode) {
    let i = 0;
    for (let n = node; (n = n.previousSibling); i++);

    node = node.parentNode;
    path.push(i);
  }
  return { attr, type, path };
}

/**
 * Compiles a DOM Tree from template strings, compiles dynamic patches
 * @param {string} type Template type, svg or html.
 * @param {TemplateStringsArray} strings Template strings
 * @param {string} scopeName Custom Element tag name, only required for Shady Shims
 * @returns {TemplateContent}
 */
function compileContent(type: string, strings: TemplateStringsArray, scopeName?: string): TemplateContent {
  // Compile the template element
  const isSvg = type === 'svg';
  const template = createTemplate(isSvg, sanitize(strings, PREFIX, isSvg));
  const patches: TemplatePatch[] = [];
  const walker = createWalker(template.content);
  const len = strings.length - 1;
  let i = 0;
  let search = `${PREFIX}${i}`;

  // Before we map the patchers we need to reconstruct the template styles
  // Merge all style elements and hoist the master up to the top
  // This optimizes performance, especially within shims
  const styles = template.querySelectorAll('style');
  if (styles.length) {
    const style = styles[0];
    template.insertBefore(style, template.firstChild);

    for (let i = 1; i < styles.length; i++) {
      const el = styles[i];
      el.parentNode?.removeChild(el);
      style.textContent += el.textContent;
    }
  }

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
        search = `${PREFIX}${++i}`;
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
        search = `${PREFIX}${++i}`;
      }

      // if the node was a style or a textarea one, check its content
      // and if it is <!--isµX--> then update text-only this node
      if (TEXT_TAGS.includes(el.localName) && node.textContent.trim() === `<!--${search}-->`) {
        node.textContent = '';
        patches[i] = createPatch(node, PatchType.TEXT);
        search = `${PREFIX}${++i}`;
      }
    }
  }

  // Apply shady shim, if available
  if (scopeName && typeof window != 'undefined') {
    window.ShadyCSS?.prepareTemplate(template, scopeName);
  }
  return { node: template, patches };
}

/**
 * Class for composing template content and patching
 * @class
 */
export class Template {
  /**
   * Template type, html or svg
   * @var {string}
   */
  readonly type: string;

  /**
   * Template strings
   * @var {TemplateStringsArray}
   */
  readonly strings: TemplateStringsArray;

  /**
   * Interpolated template values
   * @var {any[]}
   */
  readonly values: any[];

  /**
   * Updates values and does recursive template caching for templates
   * @param {TemplateCache} cache Template cache
   * @param {any[]} values Template values, dynamic content
   * @param {TemplateCompiler} compiler Template compiler for interpolated values
   * @private
   */
  private static updateValues(cache: TemplateCache, values: any[], compiler: TemplateCompiler): void {
    const { stack } = cache;

    for (let i = 0; i < values.length; i++) {
      const value = values[i];
      let cache: TemplateCache;

      if (value instanceof Template) {
        cache = stack[i] ?? createCache();
        values[i] = value.update(cache, compiler);
      } else if (Array.isArray(value)) {
        cache = stack[i] ?? createCache();
        Template.updateValues(cache, value, compiler);
      }

      stack[i] = cache;
    }

    // This will make sure the stack is fully drained
    if (values.length < stack.length) {
      stack.splice(values.length);
    }
  }

  /**
   * Constructs a new template
   * @param {string} type Template type (html or svg)
   * @param {TemplateStringsArray} strings Template strings
   * @param {any[]} values Interpolated template values
   */
  constructor(type: string, strings: TemplateStringsArray, values: any[]) {
    this.type = type;
    this.strings = strings;
    this.values = values;
  }


  /**
   * Creates a one off version of this template
   * @param {TemplateCompiler} compiler Compiler to use for patching dynamic content
   * @param {string} scopeName Custom Element tag name, only required for Shady Shims
   * @returns {Node}
   */
  updateOnce(compiler?: TemplateCompiler, scopeName?: string): Node {
    return this.update(createCache(), compiler, scopeName);
  }

  /**
   * Creates or updates the rendered template, if already rendered to cache root
   * @param {TemplateCache} cache Template cache
   * @param {TemplateCompiler} compiler Compiler to use for patching dynamic content
   * @param {string} scopeName Custom Element tag name, only required for Shady Shims
   * @returns {Node}
   */
  update(cache: TemplateCache, compiler?: TemplateCompiler, scopeName?: string): Node {
    const { strings, type, values } = this;
    let { instance } = cache;
    if (!compiler) {
      compiler = defaultCompiler;
    }

    if (!instance || instance.strings !== strings || instance.type !== type) {
      // Create instance if cache is empty, update instance if template changed
      instance = (cache.instance = this.compile(compiler, scopeName));
    }

    // Update instance values
    const { patchers } = instance;
    Template.updateValues(cache, values, compiler);

    for (let i = 0; i < values.length; i++) {
      patchers[i](values[i]);
    }
    return cache.node ?? (cache.node = persistent(instance.root));
  }

  /**
   * Compiles the template and patchers
   * @param {TemplateCompiler} compiler Compiler to use when parsing interpolated values
   * @param {string} scopeName Custom Element tag name, only required for Shady Shims
   * @returns {TemplateInstance}
   * @private
   */
  private compile(compiler: TemplateCompiler, scopeName?: string): TemplateInstance {
    const { strings, type } = this;
    let content = contentCache.get(strings);
    if (!content) {
      contentCache.set(strings, (content = compileContent(type, strings, scopeName)));
    }

    const { patches, node } = content;
    const root = document.importNode(node.content, true);
    const patchers = patches.map(({type, attr, path}) => {
      // Fallback to defaultCompiler
      const node = path.reduceRight<Node>((n, i) => n.childNodes[i], root) as Element&Comment&Text;
      return compiler?.[type]?.(node, attr) || defaultCompiler[type](node, attr) as TemplatePatcher;
    });

    return { strings, type, patchers, root };
  }
}
