import { isFunction } from '@kirei/shared';
import { hyphenate } from '@vue/shared';
import { warn } from '../logging';
import type { IKireiInstance, EmitsOptions } from '../interfaces';

/*export type Emitter<O = EmitsOptions, K extends keyof O = keyof O> =
  O extends Array<infer V>
    ? (event: V, ...args: any[]) => void
    : {} extends O
      ? (event: string, ...args: any[]) => void
      : 
    ;

export type EmitFn<
  Options = EmitsOptions,
  Event extends keyof Options = keyof Options
> = Options extends Array<infer V>
  ? (event: V, ...args: any[]) => void
  : {} extends Options // if the emit is empty object (usually the default value for emit) should be converted to function
    ? (event: string, ...args: any[]) => void
    : UnionToIntersection<
        {
          [key in Event]: Options[key] extends ((...args: infer Args) => any)
            ? (event: key, ...args: Args) => void
            : (event: key, ...args: any[]) => void
        }[Event]
      >;*/

// type inferacne of ctx.emit<T>(string, T);
//TODO maybe ditch native event listeners for internal ones?
export function emit<T = any>(instance: IKireiInstance, event: string, payload?: T): void {
  const { emits } = instance.options;

  // event to hyphencased (onclick = click)
  // ontextinput, on-text-input, onTextInput, textInput = textinput
  const name = hyphenate(event);
  const validator = emits?.[name];

  if (__DEV__) {
    if (isFunction(validator)) {
      if (!validator(payload)) {
        warn(`Component emitted event "${name}" but it is not declared in the emits option.`);
      }
    } else if (validator != null) {
      // invalid value
      warn(`Invalid event arguments: event validation failed for event "${name}".`);
    }
  }

  instance.emit();

  instance.el.dispatchEvent(new CustomEvent(name, { detail: payload }));
}*/
