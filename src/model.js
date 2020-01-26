/**
 * Validates a prop model against a value before setting it
 * Throws an error as soon as a check fails
 */
export function validateProp(prop, model, value) {
  const types = model.type;

  // Type checking
  if (value != null && !types.some(t => Object.getPrototypeOf(value) == t.prototype)) {
    throw new Error(`Type error in prop '${prop}'.`);
  }

  // Check if value is required and set (anything but undefined)
  if (model.required && typeof value == 'undefined') {
    throw new Error(`Value required in prop '${prop}'.`);
  }

  // Custom validator check
  if (model.validator && !model.validator(value)) {
    throw new Error(`Validation error in prop '${prop}'.`);
  }
};

/**
 * Parses props object into something the validator can handle
 */
export function parseProps(props) {
  return Object.entries(props)
    .map(pair => {
      const [ key, obj ] = pair;

      if (typeof obj == 'function' || Array.isArray(obj)) {
        pair[1] = { type: obj };
      } else if (typeof obj != 'object') {
        throw new Error(`Prop type invalid for prop ${key}.`);
      }

      return pair;
    })
    .reduce((acc, [ key, model ]) => {
      const { required, validator } = model;
      const types = Array.isArray(model.type) ? model.type : [model.type];
      const defType = typeof model.default;
      let def;

      // Validate types
      if (!types.every(t => typeof t == 'function')) {
        throw new TypeError(`Type invalid in prop '${key}'!`);
      }

      // Parse default value
      if (defType == 'object') {
        throw new TypeError('Prop defaults must be a primitive value, wrap objects and arrays using a function.');
      } else if (defType == 'function') {
        def = model.default;
      } else {
        def = model.default;
        if (defType == 'undefined' && types.length == 1 && types[0] === Boolean) {
          def = false;
        }
      }

      acc[key] = {
        type: types,
        default: def,
        validator: typeof validator == 'function' ? validator : null,
        required: !!required,
      };
      return acc;
    }, {});
};
