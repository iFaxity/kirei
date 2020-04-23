import { mapObject, isFunction, isObject } from '@kirei/shared';

type DefaultFactory<T = any> = () => T | null | undefined;
type PropConstructor<T = any> = { new (...args: any[]): T & object } | { (): T };
type PropType<T> = PropConstructor<T> | PropConstructor<T>[];

interface PropInstance<T = any> {
  type: PropType<T>;
  required?: boolean;
  validator?(value: unknown): boolean;
  default?: DefaultFactory<T> | T;
}
type Prop<T> = PropInstance<T> | PropType<T> | null;
export type PropsData = Record<string, unknown>;
export type Props<P = PropsData> = { [K in keyof P]: Prop<P[K]> };

interface NormalizedProp<T = any> extends PropInstance<T> {
  type: PropConstructor<T>[] | null;
  cast?: boolean;
}
export type NormalizedProps = Record<string, NormalizedProp>;

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

/**
 * Normalizes a props model, making it more predictable
 * @param {Props} props Props to normalize
 * @returns {NormalizedProps}
 */
export function normalizeProps(props: Props): NormalizedProps {
  for (const [ key, prop ] of Object.entries(props)) {
    const normal = prop as NormalizedProp;
    if (isObject<PropInstance>(prop)) {
      normal.type = (prop.type as PropConstructor[]) ?? null;
      normal.default = prop.default ?? void 0;
      normal.validator = prop.validator ?? null;
      normal.required = !!prop.required;
    } else {
      normal.type = (prop as PropConstructor[]) ?? null;
      normal.default = void 0;
      normal.validator = null;
      normal.required = false;
    }

    if (normal.type) {
      if (!Array.isArray(normal.type)) {
        normal.type = [ normal.type ];
      }
      if (!normal.type?.every(isFunction)) {
        throw new TypeError(`Type invalid in prop '${key}'!`);
      }

      // Enable casting if needed
      const master = normal.type[0];
      normal.cast = master === Boolean || master === Number;
    } else {
      normal.cast = false;
    }
  }

  return props as NormalizedProps;
}

/**
 * Extracts the default values from a props model
 * @param {NormalizedProps} props Props model to extract defaults from
 * @returns {PropsData}
 */
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

/**
 * Validates a prop against a value, casts value if needed
 * @param {NormalizedProps} props Prop model to validate from
 * @param {string} key Attribute key
 * @param {*} value Value to validate
 * @returns {*}
 */
export function validateProp(props: NormalizedProps, key: string, value: unknown): unknown {
  // Validate prop
  const { type, required, validator, cast } = props[key];

  // Type checking
  if (type != null) {
    if (value != null && !type.some(t => Object.getPrototypeOf(value) == t.prototype)) {
      throw new Error(`Type error in prop '${key}'.`);
    }
  }

  if (required && typeof value == 'undefined') {
    throw new Error(`Value required in prop '${key}'.`);
  }

  if (validator && !validator(value)) {
    throw new Error(`Validation error in prop '${key}'.`);
  }

  // TODO: look over this, could use some tweaking
  // Different parsing based on master type
  if (cast) {
    if (type[0] === Boolean) {
      // If primary type boolean, null is false, '' is true
      if (value == null || value == 'false') {
        value = false;
      } else if (value === '' || value == 'true') {
        value = true;
      }
    } else if (type[0] === Number) {
      // If number as first type, try parse value as number
      // Implicit better than parseFloat, ensures whole string is number
      let n = +value;
      if (!isNaN(n)) {
        value = n;
      }
    }
  }

  return value;
}
