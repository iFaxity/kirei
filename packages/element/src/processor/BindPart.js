import { isObject } from '../shared';
export class FxBindPart {
    constructor(element, name, strings) {
        this.value = undefined;
        if (strings.length !== 2 || strings[0] !== '' || strings[1] !== '') {
            throw new Error('Conditional attributes can only contain a single expression');
        }
        this.element = element;
        this.name = name;
        this.strings = strings;
    }
    setValue(value) {
        if (!isObject(value)) {
            throw new TypeError('Bind can only work with Object');
        }
        this.value = value;
    }
    commit() {
        Object.entries(this.value).forEach(([key, value]) => {
            if (value) {
                this.element.setAttribute(key, value.toString());
            }
            else {
                this.element.removeAttribute(key);
            }
        });
    }
}
//# sourceMappingURL=BindPart.js.map