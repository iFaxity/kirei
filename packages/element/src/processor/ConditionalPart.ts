import { Part, noChange, isDirective } from 'lit-html';
import { toRawValue } from '@shlim/fx';

export class FxConditionalPart implements Part {
  readonly element: Element;
  readonly name: string;
  readonly strings: ReadonlyArray<string>;
  value: unknown = undefined;
  private __pendingValue: unknown = undefined;
  private comment: Comment;

  constructor(element: Element, name: string, strings: ReadonlyArray<string>) {
    if (strings.length != 2 || strings[0] !== '' || strings[1] !== '') {
      throw new Error(
          'Conditional attributes can only contain a single expression');
    }

    this.element = element;
    this.name = name;
    this.strings = strings;
    this.comment = document.createComment('');
  }

  setValue(value: unknown): void {
    this.__pendingValue = toRawValue(value);
  }

  commit() {
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

      oldChild.parentNode?.replaceChild(newChild, oldChild);
      this.value = value;
    }

    this.__pendingValue = noChange;
  }
}
