"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const shared_1 = require("@kirei/shared");
/**
 * Normalizes a props model, making it more predictable
 * @param {Props} props Props to normalize
 * @returns {NormalizedProps}
 */
function normalizeProps(props) {
    var _a, _b, _c, _d, _e;
    for (const key of Object.keys(props)) {
        const prop = props[key];
        const normal = prop;
        if (shared_1.isObject(prop)) {
            normal.type = (_a = prop.type) !== null && _a !== void 0 ? _a : null;
            normal.default = (_b = prop.default) !== null && _b !== void 0 ? _b : void 0;
            normal.validator = (_c = prop.validator) !== null && _c !== void 0 ? _c : null;
            normal.required = !!prop.required;
        }
        else {
            normal.type = (_d = prop) !== null && _d !== void 0 ? _d : null;
            normal.default = void 0;
            normal.validator = null;
            normal.required = false;
        }
        if (normal.type) {
            if (!Array.isArray(normal.type)) {
                normal.type = [normal.type];
            }
            if (!((_e = normal.type) === null || _e === void 0 ? void 0 : _e.every(shared_1.isFunction))) {
                throw new TypeError(`Type invalid in prop '${key}'!`);
            }
            // Enable casting if needed
            const master = normal.type[0];
            normal.cast = master === Boolean || master === Number;
        }
        else {
            normal.cast = false;
        }
    }
    return props;
}
exports.normalizeProps = normalizeProps;
/**
 * Extracts the default values from a props model
 * @param {NormalizedProps} props Props model to extract defaults from
 * @returns {PropsData}
 */
function propDefaults(props) {
    return shared_1.mapObject((key, prop) => {
        const { type, default: def } = prop;
        let value = shared_1.isFunction(def) ? def() : def;
        if (type != null && typeof def == 'undefined' && type.length == 1 && type[0] == Boolean) {
            value = true;
        }
        return [key, value];
    }, props);
}
exports.propDefaults = propDefaults;
/**
 * Validates a prop against a value, casts value if needed
 * @param {NormalizedProps} props Prop model to validate from
 * @param {string} key Attribute key
 * @param {*} value Value to validate
 * @returns {*}
 */
function validateProp(props, key, value) {
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
    return value;
}
exports.validateProp = validateProp;
//# sourceMappingURL=props.js.map