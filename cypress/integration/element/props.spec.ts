// @ts-nocheck
/// <reference types="cypress" />
import { normalizeProps, propDefaults, validateProp } from '@kirei/element/src/runtime/props';

const UNDEFINED = void 0; // undefined

// Contains default prop model values
function createProp(prop) {
  if (prop.type != null && !Array.isArray(prop.type)) {
    prop.type = [ prop.type ];
  }

  return { required: false, validator: null, cast: false, ...prop };
}

function assertProps(rawProps, expected) {
  const props = normalizeProps(rawProps);
  const keys = Object.keys(expected);
  assert.hasAllKeys(props, keys);

  for (const key of keys) {
    const actual = props[key];
    const expect = createProp(expected[key]);

    if (actual.type == null) {
      assert.isNull(expect.type, `"type" invalid for prop "${key}"`);
    } else if (Array.isArray(actual.type)) {
      assert.deepEqual(actual.type, expect.type, `"type" invalid for prop "${key}"`);
    } else {
      assert.deepEqual([ actual.type ], expect.type, `"type" invalid for prop "${key}"`);
    }

    assert.equal(actual.required, expect.required, `"required" invalid for prop "${key}"`);
    assert.equal(actual.validator, expect.validator, `"validator" invalid for prop "${key}"}`);
    assert.equal(actual.default, expect.default, `"default" invalid for prop "${key}"`);
    assert.equal(actual.cast, expect.cast, `"cast" invalid for prop "${key}"`);
  }
}

describe('props', () => {
  describe('#normalizeProps()', () => {
    it('with types only', () => {
      assertProps({
        text: String,
        value: [ Boolean, String ],
        count: Number,
        any: null,
      }, {
        text: { type: [ String ] },
        value: {
          type: [ Boolean, String ],
          cast: true,
        },
        count: {
          type: [ Number ],
          cast: true,
        },
        any: { type: null },
      });
    });
    it('with expanded types', () => {
      const validator = () => true;
      assertProps({
        text: {
          type: String,
        },
        value: {
          type: [ Boolean, String ],
          required: true,
        },
        count: {
          type: Number,
          default: 0,
        },
        any: {
          type: null,
          validator,
          cast: true,
        }
      }, {
        text: { type: [ String ] },
        value: {
          type: [ Boolean, String ],
          required: true,
          cast: true,
        },
        count: {
          type: [ Number ],
          default: 0,
          cast: true,
        },
        any: {
          type: null,
          validator,
          cast: false,
        },
      });

      it('with invalid type', () => {
        assert.throws(() => normalizeProps({ text: true }));
      })
    });
  });

  describe('#propDefaults()', () => {

    it('invalid argument', () => {
      assert.throws(() => propDefaults(UNDEFINED));
      assert.throws(() => propDefaults(null));
    });
    it('no default props', () => {
      const props = {
        obj: createProp({ type: Object }),
        num: createProp({ type: Number }),
        text: createProp({ type: [ Boolean, String ], required: true }),
      };

      assert.deepEqual(propDefaults(props), { obj: UNDEFINED, num: UNDEFINED, text: false });
    });
    it('with primitive', () => {
      const prop = createProp({ type: Number, default: 345 });
      assert.deepEqual(propDefaults({ primitive: prop }), { primitive: 345 });
    });
    it('with object factory', () => {
      const prop = createProp({ type: Object, default: () => ({ foo: 'bar', baz: 'foz' }) });
      const res = propDefaults({ obj: prop });

      assert.deepEqual(res, { obj: { foo: 'bar', baz: 'foz' } });
      assert.notEqual(propDefaults({ obj: prop }).obj, res.obj);
    });
    it('with object', () => {
      const prop = createProp({ type: Object, default: { foo: 'bar', baz: 'foz' } });
      const res = propDefaults({ obj: prop });

      assert.deepEqual(res, { obj: { foo: 'bar', baz: 'foz' } });
      assert.equal(propDefaults({ obj: prop }).obj, res.obj);
    });
    it('invalid default type', () => {
      const prop = createProp({ type: Number, default: '123def' });
      assert.throws(() => propDefaults({ text: prop }));
    });
  });

  describe('#validateProp()', () => {
    describe('type', () => {
      it('any', () => {
        const prop = createProp({ type: null });

        assert.isTrue(validateProp(prop, 'any', true));
        assert.equal(validateProp(prop, 'any', 100), 100);
        assert.equal(validateProp(prop, 'any', null), null);
        assert.equal(validateProp(prop, 'any', '123'), '123');
        assert.deepEqual(validateProp(prop, 'any', [ 'hello', 123 ]), [ 'hello', 123 ]);
        assert.deepEqual(validateProp(prop, 'any', { foo: 'bar' }), { foo: 'bar' });
      });
      it('string', () => {
        const prop = createProp({ type: String });

        assert.equal(validateProp(prop, 'text', 'Hello'), 'Hello');
        assert.throws(() => validateProp(prop, 'text', 100));
        assert.throws(() => validateProp(prop, 'text', []));
      });
      it('number', () => {
        const prop = createProp({ type: Number });

        assert.equal(validateProp(prop, 'count', 3), 3);
        assert.equal(validateProp(prop, 'count', null), null);
        assert.throws(() => validateProp(prop, 'count', true));
        assert.throws(() => validateProp(prop, 'count', {}));
      });
      it('boolean', () => {
        const prop = createProp({ type: Boolean });

        assert.isTrue(validateProp(prop, 'bool', true));
        assert.equal(validateProp(prop, 'bool', null), null);
        assert.throws(() => validateProp(prop, 'bool', 'test'));
        assert.throws(() => validateProp(prop, 'bool', 0));
      });
      it('array', () => {
        const prop = createProp({ type: Array });
        const empty = [];
        const list = ['list', 123, true, ['nested']];

        assert.equal(validateProp(prop, 'list', empty), empty);
        assert.equal(validateProp(prop, 'list', list), list);
        assert.equal(validateProp(prop, 'list', null), null);
        assert.throws(() => validateProp(prop, 'list', true));
        assert.throws(() => validateProp(prop, 'list', 100));
        assert.throws(() => validateProp(prop, 'list', {}));
      });
      it('object', () => {
        const prop = createProp({ type: Object });
        const empty = {};
        const obj = { s: 'hi', n: 10, b: true, o: { t: 'nest' } };
        class Test {}

        assert.equal(validateProp(prop, 'obj', empty), empty);
        assert.equal(validateProp(prop, 'obj', obj), obj);
        assert.equal(validateProp(prop, 'obj', null), null);
        assert.throws(() => validateProp(prop, 'obj', 'hi'));
        assert.throws(() => validateProp(prop, 'obj', false));
        assert.throws(() => validateProp(prop, 'obj', []));
        assert.throws(() => validateProp(prop, 'obj', new Test()));
      });
      it('mixed', () => {{
        const prop = createProp({ type: [ String, Number, Array ] });

        assert.equal(validateProp(prop, 'mixed', 'Hello'), 'Hello');
        assert.equal(validateProp(prop, 'mixed', 100), 100);
        assert.deepEqual(validateProp(prop, 'mixed', []), []);
        assert.equal(validateProp(prop, 'mixed', null), null);
        assert.throws(() => validateProp(prop, 'mixed', {}));
        assert.throws(() => validateProp(prop, 'mixed', true));
      }});
    });

    describe('validator', () => {
      it('succeding function', () => {
        const prop = createProp({ type: null, validator: (v) => v > 10 });
        assert.equal(validateProp(prop, 'test', 400), 400);
      });
      it('failing function', () => {
        const prop = createProp({ type: null, validator: (v) => v == '' || v == 'active' });
        assert.throws(() => validateProp(prop, 'test', true));
      });
      it('non function', () => {
        const prop = createProp({ type: null, validator: 'hello' });
        assert.throws(() => validateProp(prop, 'test', 100));
      });
    });

    describe('required', () => {
      it('undefined value', () => {
        const prop = createProp({ type: Number, required: true });
        assert.throws(() => validateProp(prop, 'count', UNDEFINED));
      });
      it('defined invalid value', () => {
        const prop = createProp({ type: Number, required: true });
        assert.throws(() => validateProp(prop, 'count', 'invalid'));
      });
      it('defined valid value', () => {
        const prop = createProp({ type: String, required: true });
        assert.equal(validateProp(prop, 'text', 'invalid'), 'invalid');
      });
    });

    describe('cast', () => {
      it('successful boolean casting', () => {
        const prop = createProp({ type: [ Boolean, String ], cast: true });
        assert.isTrue(validateProp(prop, 'bool', 'true'));
        assert.isTrue(validateProp(prop, 'bool', ''));
        assert.isFalse(validateProp(prop, 'bool', 'false'));
        assert.isFalse(validateProp(prop, 'bool', null));
        assert.isFalse(validateProp(prop, 'bool', UNDEFINED));
      });
      it('failed boolean casting', () => {
        const prop = createProp({ type: [ Boolean, String ], cast: true });
        assert.equal(validateProp(prop, 'bool', 'TRUE'), 'TRUE');
        assert.equal(validateProp(prop, 'bool', 'FaLsE'), 'FaLsE');
        assert.equal(validateProp(prop, 'bool', 'falsy'), 'falsy');
      });
      it('successful number casting', () => {
        const prop = createProp({ type: [ Number, String ], cast: true });
        assert.equal(validateProp(prop, 'num', '123'), 123);
        assert.equal(validateProp(prop, 'num', '0456'), 456);
        assert.equal(validateProp(prop, 'num', '0.789'), 0.789);
        assert.equal(validateProp(prop, 'num', '0b110'), 6);
        assert.equal(validateProp(prop, 'num', '0o33'), 27);
        assert.equal(validateProp(prop, 'num', '0xF0'), 240);
      });
      it('failed number casting', () => {
        const prop = createProp({ type: [ Number, String ], cast: true });
        assert.equal(validateProp(prop, 'num', 'test123'), 'test123');
        assert.equal(validateProp(prop, 'num', '0,01'), '0,01');
      });
    });
  });
});
