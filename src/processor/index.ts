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
import { isObject } from '../shared';
import { toRawValue } from '../reactive';

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
  protected _createPart(): AttributePart {
    return new FxAttributePart(this, this.name);
  }
}

export class FxPropertyCommitter extends PropertyCommitter {
  protected _createPart(): AttributePart {
    return new FxAttributePart(this, null);
  }
}

/**
 * Creates Parts when a template is instantiated.
 */
export class FxTemplateProcessor implements TemplateProcessor {
  handleAttributeExpressions(
    element: Element,
    name: string,
    strings: ReadonlyArray<string>,
    options: RenderOptions
  ): ReadonlyArray<Part> {
    const prefix = name[0];

    // Get custom part from parts map
    const part = parts.get(prefix);
    if (part) {
      return part(element, name.slice(1), strings, options);
    }

    // Default to attribute committer
    const committer = new FxAttributeCommitter(element, name, strings);
    return committer.parts;
  }

  handleTextExpression(options: RenderOptions): NodePart {
    return new FxNodePart(options);
  }
}

export const templateProcessor = new FxTemplateProcessor();
export const parts: Map<string, Function> = new Map([
  ['.', (element: Element, name: string, strings: ReadonlyArray<string>): readonly Part[] => {
    const committer = new FxPropertyCommitter(element, name, strings);
    return committer.parts;
  }],
  ['@', (element: Element, name: string, strings: ReadonlyArray<string>, options: RenderOptions): readonly Part[] => {
    return [new FxEventPart(element, name, options.eventContext)];
  }],
  ['?', (element: Element, name: string, strings: ReadonlyArray<string>): readonly Part[] => {
    return [new FxBooleanAttributePart(element, name, strings)];
  }],
  ['&', (element: Element, name: string): readonly Part[] => {
    return [new FxSyncPart(element, name)];
  }],
  ['!', (element: Element, name: string, strings: ReadonlyArray<string>): readonly Part[] => {
    return [new FxConditionalPart(element, name, strings)];
  }],
  [':', (element: Element, name: string, strings: ReadonlyArray<string>): readonly Part[] => {
    return [new FxBindPart(element, name, strings)];
  }],
]);
