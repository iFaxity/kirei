import {
  TemplateProcessor,
  AttributePart,
  AttributeCommitter,
  BooleanAttributePart,
  NodePart,
  PropertyCommitter,
  Part,
  RenderOptions,
} from 'lit-html';
import { FxBindPart } from './BindPart';
import { FxConditionalPart } from './ConditionalPart';
import { FxEventPart } from './EventPart';
import { FxSyncPart } from './SyncPart';
import { isObject } from '@shlim/shared';
import { toRawValue, Ref, isRef } from '@shlim/fx';
export { Part, RenderOptions };

const NAME_REGEX = /^v-(\w+)(.*)$/;
const NAME_TEST_REGEX = /^\w+$/;

type PartsFunction = (el: Element, name: string, strings?: readonly string[], options?: RenderOptions) => readonly Part[];
const parts: Map<string, PartsFunction> = new Map();
interface PartOptions {
  name?: string;
  shorthand?: string;
  factory: PartsFunction;
}

// If a reactive object, ref or computed is sent as a value
// we need to resolve the raw value from it
export class FxAttributePart extends AttributePart {
  readonly name: string;
  readonly mapValue: boolean;

  constructor(committer: AttributeCommitter, name: string) {
    super(committer);
    this.name = name;
    this.mapValue = name == 'class' || name == 'style';
  }

  setValue(value: unknown): void {
    let raw = toRawValue(value);

    if (this.mapValue) {
      if (isObject(raw)) {
        raw = Object.keys(raw).filter(key => !!raw[key]).join(' ');
      } else if (Array.isArray(raw)) {
        raw = raw.filter(x => x).join(' ');
      }
    }
    
    super.setValue(raw);
  }
}

export class FxNodePart extends NodePart {
  setValue(value: unknown): void {
    super.setValue(toRawValue(value));
  }
}

export class FxBooleanAttributePart extends BooleanAttributePart {
  setValue(value: unknown): void {
    super.setValue(toRawValue(value));
  }
}

export class FxAttributeCommitter extends AttributeCommitter {
  protected _createAttributePart(): AttributePart {
    return new FxAttributePart(this, this.name);
  }
}

export class FxPropertyCommitter extends PropertyCommitter {
  protected _createAttributePart(): AttributePart {
    return new FxAttributePart(this, null);
  }
}

// Just a part to set references for an element
export class FxRefPart implements Part {
  readonly element: Element;
  ref: Ref;
  value: unknown;

  constructor(element: Element) {
    this.element = element;
  }

  setValue(ref: Ref) {
    if (!isRef(ref)) {
      throw new TypeError('Ref attributes requires a ref as their expression!');
    }

    this.ref = ref;
  }

  commit() {
    this.ref.value = this.element;
  }
}

/**
 * Creates Parts when a template is instantiated.
 */
export class FxTemplateProcessor implements TemplateProcessor {
  handleAttributeExpressions(
    el: Element,
    name: string,
    strings: readonly string[],
    options: RenderOptions
  ): ReadonlyArray<Part> {
    // Special case, check for this first
    if (name == 'ref') {
      return [ new FxRefPart(el) ];
    }

    // Check for name
    if (name.startsWith('v-')) {
      const res = NAME_REGEX.exec(name);
      const part = parts.get(res[1]);

      if (part) {
        return part(el, res[2], strings, options);
      }
    }

    // Check if there is a shorthand
    const part = parts.get(name[0]);
    if (part) {
      return part(el, name.slice(1), strings, options);
    }

    // Default to attribute committer
    const committer = new FxAttributeCommitter(el, name, strings);
    return committer.parts;
  }

  handleTextExpression(options: RenderOptions): NodePart {
    return new FxNodePart(options);
  }
}

export const templateProcessor = new FxTemplateProcessor();

/**
 * Creates a attribute part
 * @param {PartOptions} options 
 */
export function createAttributePart(options: PartOptions): void {
  const { name, shorthand, factory } = options;

  if (shorthand && shorthand.length != 1) {
    throw new TypeError('Part shorthands needs to be exactly one character!');
  }
  if (name && !NAME_TEST_REGEX.test(name)) {
    throw new TypeError('Part names can only contain [A-Za-z-].');
  }

  shorthand && parts.set(shorthand, factory);
  name && parts.set(name, factory);
}

// Add default parts
createAttributePart({
  shorthand: '.',
  factory(el, name, strings) {
    const committer = new FxPropertyCommitter(el, name, strings);
    return committer.parts;
  },
});
createAttributePart({
  shorthand: '@',
  name: 'on',
  factory(el, name, _, options) {
    return [new FxEventPart(el, name, options.eventContext)];
  },
});
createAttributePart({
  shorthand: '?',
  name: 'toggle',
  factory(el, name, strings) {
    return [new FxBooleanAttributePart(el, name, strings)];
  },
});
createAttributePart({
  shorthand: '&',
  name: 'sync',
  factory(el, name) {
    return [new FxSyncPart(el, name)];
  },
});
createAttributePart({
  shorthand: '!',
  name: 'if',
  factory(el, name, strings) {
    return [new FxConditionalPart(el, name, strings)];
  },
});
createAttributePart({
  name: 'bind',
  factory(el, name, strings) {
    return [new FxBindPart(el, name, strings)]
  },
});
