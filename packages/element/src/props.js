import { mapObject, isFunction, isObject } from './shared';
export function normalizeProps(props) {
    return mapObject((key, prop) => {
        var _a, _b, _c, _d;
        const normal = {
            default: undefined,
            validator: null,
            required: false,
            cast: false,
        };
        if (prop == null) {
            normal.type = null;
        }
        else if (isObject(prop)) {
            normal.type = (_a = prop.type) !== null && _a !== void 0 ? _a : null;
            normal.default = (_b = prop.default) !== null && _b !== void 0 ? _b : undefined;
            normal.validator = (_c = prop.validator) !== null && _c !== void 0 ? _c : null;
            normal.required = !!prop.required;
        }
        else {
            normal.type = prop;
        }
        if (normal.type && !Array.isArray(normal.type)) {
            normal.type = [normal.type];
        }
        // Validate types (and cast?)
        if (!((_d = normal.type) === null || _d === void 0 ? void 0 : _d.every(isFunction))) {
            throw new TypeError(`Type invalid in prop '${key}'!`);
        }
        return [key, normal];
    }, props);
}
export function propDefaults(props) {
    return mapObject((key, prop) => {
        const { type, default: def } = prop;
        let value = isFunction(def) ? def() : def;
        if (type != null && typeof def == 'undefined' && type.length == 1 && type[0] == Boolean) {
            value = true;
        }
        return [key, value];
    }, props);
}
export function validateProp(props, key, value) {
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
        // Different parsing based on first (or only) type
        if (type[0] === Boolean) {
            // If primary type boolean, null is false, '' is true
            if (value == null || value == 'false') {
                value = false;
            }
            else if (value === '' || value == 'true') {
                value = true;
            }
        }
        else if (type[0] === Number) {
            // If number as first type, try parse value as number
            // Implicit better than parseFloat, ensures whole string is number
            let n = +value;
            if (!isNaN(n)) {
                value = n;
            }
        }
    }
    // as the value might get casted we return it again
    return value;
}
//# sourceMappingURL=props.js.map