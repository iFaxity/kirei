import { mapObject, isFunction, isObject, isUndefined } from '@kirei/shared';
import { warn } from './logging';

import type { Props, PropsData, NormalizedProps, NormalizedProp, PropInstance, PropConstructor } from './interfaces';

/**
 * Normalizes a props model, making it more predictable
 * @param {Props} props Props to normalize
 * @returns {NormalizedProps}
 * @private
 */
export function normalizeProps<T = Props>(props: T): NormalizedProps<T> {
  for (const key of Object.keys(props)) {
    const prop = props[key];
    // @ts-ignore
    let normal = prop as NormalizedProp;

    if (isObject<PropInstance>(prop) && !Array.isArray(prop)) {
      normal.type = prop.type as PropConstructor[];
      normal.default = prop.default;
      normal.validator = prop.validator ?? null;
      normal.required = !!prop.required;
    } else {
      // @ts-ignore
      normal = props[key] = {
        type: prop as PropConstructor[],
        validator: null,
        required: false,
      } as NormalizedProp;
    }

    if (normal.type) {
      if (!Array.isArray(normal.type)) {
        normal.type = [ normal.type ];
      }
      if (!normal.type?.every(isFunction)) {
        throw new TypeError(`Type invalid in prop '${key}'!`);
      }

      // Enable casting if needed
      const [ first ] = normal.type;
      normal.cast = first === Boolean || first === Number;
    } else {
      normal.cast = false;
    }
  }

  // @ts-ignore
  return props as NormalizedProps<T>;
}

/**
 * Extracts the default values from a props model
 * @param {NormalizedProps} props Props model to extract defaults from
 * @returns {PropsData}
 * @private
 */
export function propDefaults<T extends NormalizedProps>(props: T): PropsData<T> {
  return mapObject<T, string, PropsData<T>>((key, prop) => {
    const { type, default: def } = prop;
    if (isObject(def)) {
      warn(`Prop defaults requires Objects to be returned by a factory function
 to avoid cross referencing across elements.`);
    }

    // Validate props default value (if defined)
    let value: unknown;
    if (!isUndefined(def)) {
      value = isFunction(def) ? def() : def;
      try {
        // Validate default value
        validateProp(prop, key, value);
      } catch (ex) {
        throw new TypeError(`Default prop value invalid for prop "${key}", type "${typeof value}" unexpected.`);
      }
    } else if (type != null && type[0] === Boolean) {
      value = false;
    }

    return [ key, value as string ];
  }, props);
}

/**
 * Validates a prop against a value, casts value if needed
 * @param {NormalizedProp<V>} props Normalized prop model to validate from
 * @param {string} key Attribute key
 * @param {*} value Value to validate
 * @returns {V}
 * @private
 */
export function validateProp<T extends NormalizedProp, V = T extends NormalizedProp<infer I> ? I : any>(prop: T, key: string, value: any): V {
  // Validate prop
  const { type, required, validator, cast } = prop;

  // Type checking
  if (type != null) {
    if (value != null && !type.some(t => Object.getPrototypeOf(value) == t.prototype)) {
      throw new Error(`Type error in prop '${key}'.`);
    }
  }

  if (required && isUndefined(value)) {
    throw new Error(`Value required in prop '${key}'.`);
  }

  if (validator && !validator(value)) {
    throw new Error(`Validation error in prop '${key}'.`);
  }

  // Different parsing based on first type
  if (cast) {
    switch (type[0]) {
      case Boolean:
        // If primary type boolean, null or undefined is false, '' is true
        const str = String(value);
        if (value == null || str === 'false') {
          // @ts-ignore
          return false;
        } else if (str === '' || str === 'true') {
          // @ts-ignore
          return true;
        }
        break;

      case Number:
        // If number as first type, try parse value as number
        let n = Number(value);
        if (!isNaN(n)) {
          // @ts-ignore
          return n;
        }
    }
  }

  return value;
}
