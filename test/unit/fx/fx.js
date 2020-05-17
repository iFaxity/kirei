const { Fx, fxStack, activeFx, trackStack } = require('../../../packages/fx/dist/fx');
const { strict: assert } = require('assert');

describe('@kirei/fx', () => {
  describe('Fx', () => {
    describe('constructor', () => {
      it('constructor', () => {
        const fn = () => {};
        const fx = new Fx(fn);

        assert.equal(fx.computed, false);
        assert.equal(fx.raw, fn);
      });

      it('with options', () => {
        const scheduler = () => {};
        const fx = new Fx(() => {}, {
          computed: true, scheduler,
        });

        assert.equal(fx.computed, true);
        assert.equal(fx.scheduler, scheduler);
      });

      it('copy fx', () => {
        const fx = new Fx(() => {});
        const copy = new Fx(fx);
        assert.equal(fx.raw, copy.raw);
      });
    });

    describe('tracking', () => {
      beforeEach(() => {
        while(trackStack.length) {
          trackStack.pop();
        }
      });

      it('pause then resume tracking', () => {
        Fx.pauseTracking();
        assert.deepEqual(trackStack, [ true ]);

        Fx.resumeTracking();
        assert.deepEqual(trackStack, [ true, false ]);
      });

      it('reset tracking', () => {
        Fx.pauseTracking();
        Fx.resumeTracking();
        assert.deepEqual(trackStack, [ true, false ]);

        Fx.resetTracking();
        assert.deepEqual(trackStack, [ true ]);
        Fx.resetTracking();
        assert.deepEqual(trackStack, []);
      });
    });

    it('stop fx', () => {
      const fx = new Fx(() => {});
      assert.equal(fx.active, true);
  
      fx.stop();
      assert.equal(fx.active, false);
    });
  });
});
