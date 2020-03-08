import { AttributePart, AttributeCommitter, BooleanAttributePart, NodePart, PropertyCommitter, } from 'lit-html';
import { FxBindPart } from './BindPart';
import { FxConditionalPart } from './ConditionalPart';
import { FxEventPart } from './EventPart';
import { FxSyncPart } from './SyncPart';
import { isObject } from '../shared';
import { toRawValue } from '../reactive';
// If a reactive object, ref or computed is sent as a value
// we need to resolve the raw value from it
export class FxAttributePart extends AttributePart {
    constructor(committer, name) {
        super(committer);
        this.name = name;
        this.mapValue = name == 'class' || name == 'style';
    }
    setValue(value) {
        let raw = toRawValue(value);
        if (this.mapValue) {
            if (isObject(raw)) {
                raw = Object.keys(raw).filter(key => !!raw[key]).join(' ');
            }
            else if (Array.isArray(raw)) {
                raw = raw.filter(x => x).join(' ');
            }
        }
        super.setValue(raw);
    }
}
export class FxNodePart extends NodePart {
    setValue(value) {
        super.setValue(toRawValue(value));
    }
}
export class FxBooleanAttributePart extends BooleanAttributePart {
    setValue(value) {
        super.setValue(toRawValue(value));
    }
}
export class FxAttributeCommitter extends AttributeCommitter {
    _createPart() {
        return new FxAttributePart(this, this.name);
    }
}
export class FxPropertyCommitter extends PropertyCommitter {
    _createPart() {
        return new FxAttributePart(this, null);
    }
}
/**
 * Creates Parts when a template is instantiated.
 */
export class FxTemplateProcessor {
    handleAttributeExpressions(el, name, strings, options) {
        const prefix = name[0];
        // Get custom part from parts map
        const part = parts.get(prefix);
        if (part) {
            return part(el, name.slice(1), strings, options);
        }
        // Default to attribute committer
        const committer = new FxAttributeCommitter(el, name, strings);
        return committer.parts;
    }
    handleTextExpression(options) {
        return new FxNodePart(options);
    }
}
export const templateProcessor = new FxTemplateProcessor();
export const parts = new Map([
    ['.', (el, name, strings) => {
            const committer = new FxPropertyCommitter(el, name, strings);
            return committer.parts;
        }],
    ['@', (el, name, strings, options) => {
            return [new FxEventPart(el, name, options.eventContext)];
        }],
    ['?', (el, name, strings) => {
            return [new FxBooleanAttributePart(el, name, strings)];
        }],
    ['&', (el, name) => {
            return [new FxSyncPart(el, name)];
        }],
    ['!', (el, name, strings) => {
            return [new FxConditionalPart(el, name, strings)];
        }],
    [':', (el, name, strings) => {
            return [new FxBindPart(el, name, strings)];
        }],
]);
//# sourceMappingURL=index.js.map