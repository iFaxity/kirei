import { Part } from 'lit-html';
import { isObject } from '../shared';

export class FxBindPart implements Part {
  readonly element: Element;
  readonly name: string;
  readonly strings: ReadonlyArray<string>;
  value: unknown = undefined;

  constructor(element: Element, name: string, strings: ReadonlyArray<string>) {
    if (strings.length !== 2 || strings[0] !== '' || strings[1] !== '') {
      throw new Error(
          'Conditional attributes can only contain a single expression');
    }

    this.element = element;
    this.name = name;
    this.strings = strings;
  }

  setValue(value: unknown): void {
    if (!isObject(value)) {
      throw new TypeError('Bind can only work with Object');
    }

    this.value = value;
  }

  commit() {
    Object.entries(this.value).forEach(([key, value]) => {
      if (value) {
        this.element.setAttribute(key, value.toString());
      } else {
        this.element.removeAttribute(key);
      }
    });
  }
}
