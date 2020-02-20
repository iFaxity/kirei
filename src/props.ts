import { mapObject, isFunction, isObject } from './shared';

type DefaultFactory<T = any> = () => T | null | undefined;
type PropConstructor<T> = { new (...args: any[]): T & object } | { (): T };
type PropType<T> = PropConstructor<T> | PropConstructor<T>[];

interface PropInstance<T = any> {
  type: PropType<T>;
  required?: boolean;
  validator?(value: unknown): boolean;
  default?: DefaultFactory<T> | T;
}
type PropsData = { [key: string]: unknown };
type Prop<T> = PropInstance<T> | PropType<T> | null;
export type Props<P = PropsData> = { [K in keyof P]: Prop<P[K]> };

interface NormalizedProp<T = any> extends PropInstance<T> {
  type: PropConstructor<T>[] | null;
  cast?: boolean;
}
export type NormalizedProps = { [key: string]: NormalizedProp };

type RequiredKeys<T> = {
  [K in keyof T]: T[K] extends { required: true } | { default: any } ? K : never;
}[keyof T];
type OptionalKeys<T> = Exclude<keyof T, RequiredKeys<T>>;

type InferPropType<T> = T extends null | { type: null }
  ? any
  : T extends typeof Object | { type: typeof Object }
    ? { [key: string]: any }
    : T extends Prop<infer V>
      ? V
      : T
;
export type ResolvePropTypes<T> =
  { [K in RequiredKeys<T>]: InferPropType<T[K]> } &
  { [K in OptionalKeys<T>]?: InferPropType<T[K]> }
;

export function normalizeProps(props: Props): NormalizedProps {
  return mapObject((key, prop) => {
    const normal = {
      default: undefined,
      validator: null,
      required: false,
      cast: false,
    } as NormalizedProp;

    if (prop == null) {
      normal.type = null;
    } else if (isFunction(prop)) {
      normal.type = [ prop ];
    } else if (Array.isArray(prop)) {
      normal.type = prop;
    } else if (isObject(prop)) {
      normal.type = prop.type ?? null;
      normal.default = prop.default ?? undefined;
      normal.validator = prop.validator ?? null;
      normal.required = !!prop.required;
    }

    // Validate types (and cast?)
    if (!normal.type?.every(isFunction)) {
      throw new TypeError(`Type invalid in prop '${key}'!`);
    }

    return [ key, normal ];
  }, props);
}

export function propDefaults(props: NormalizedProps): PropsData {
  return mapObject((key, prop) => {
    const { type, default: def } = prop;
    let value = isFunction(def) ? (def as DefaultFactory)() : def;

    if (type != null && typeof def == 'undefined' && type.length == 1 && type[0] == Boolean) {
      value = true;
    }

    return [ key, value ];
  }, props);
}

export function validateProp(props: NormalizedProps, key: string, value: any): any {
  // Validate prop
  const { type, required, validator, cast } = props[key];

  // Type checking
  if (value != null && !type.some(t => Object.getPrototypeOf(value) == t.prototype)) {
    throw new Error(`Type error in prop '${key}'.`);
  }

  // Check if value is required and set (anything but undefined)
  if (required && typeof value == 'undefined') {
    throw new Error(`Value required in prop '${key}'.`);
  }

  // Custom validator check
  if (validator && !validator(value)) {
    throw new Error(`Validation error in prop '${key}'.`);
  }

  if (cast) {
    
  }

  // as the value might get casted we return it again
  return value;
}
