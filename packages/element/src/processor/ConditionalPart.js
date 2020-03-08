import { noChange, isDirective } from 'lit-html';
import { toRawValue } from '../reactive';
export class FxConditionalPart {
    constructor(element, name, strings) {
        this.value = undefined;
        this.__pendingValue = undefined;
        if (strings.length != 2 || strings[0] !== '' || strings[1] !== '') {
            throw new Error('Conditional attributes can only contain a single expression');
        }
        this.element = element;
        this.name = name;
        this.strings = strings;
        this.comment = document.createComment('');
    }
    setValue(value) {
        this.__pendingValue = toRawValue(value);
    }
    commit() {
        var _a;
        while (isDirective(this.__pendingValue)) {
            const directive = this.__pendingValue;
            this.__pendingValue = noChange;
            directive(this);
        }
        if (this.__pendingValue === noChange) {
            return;
        }
        const { element, comment } = this;
        const pending = !!this.__pendingValue;
        const value = this.name == 'not' ? !pending : pending;
        if (this.value !== value) {
            const oldChild = value ? comment : element;
            const newChild = value ? element : comment;
            (_a = oldChild.parentNode) === null || _a === void 0 ? void 0 : _a.replaceChild(newChild, oldChild);
            this.value = value;
        }
        this.__pendingValue = noChange;
    }
}
//# sourceMappingURL=ConditionalPart.js.map