/// <reference types="cypress" />
import { Fx, fxStack, activeFx, trackStack } from '@kirei/fx/dist/fx';

describe('@kirei/fx/fx', () => {
  beforeEach(() => {
    // Drain tracking stack on every run
    while(trackStack.length) {
      trackStack.pop();
    }
  });
  
  describe('Fx', () => {
    describe('#constructor()', () => {
      it('with function', (done) => {
        new Fx((...args) => {
          assert.deepEqual(args, []);
          done();
        });
      });

      it('with lazy', () => {
        const fn = () => assert.fail('Should not run when lazy');
        const fx = new Fx(fn, { lazy: true });

        assert.equal(fx.raw, fn);
        assert.equal(fx.computed, false);
        assert.equal(fx.scheduler, undefined);
      });

      it('with options', () => {
        const scheduler = () => {};
        const fx = new Fx(() => {}, {
          computed: true, scheduler,
          lazy: true,
        });

        assert.equal(fx.computed, true);
        assert.equal(fx.scheduler, scheduler);
      });

      it('copy fx', () => {
        const fx = new Fx(() => {}, { lazy: true });
        const copy = new Fx(fx, { lazy: true });
        assert.equal(fx.raw, copy.raw);
      });
    });

    describe('#scheduleRun()', () => {
      it('without scheduler', (done) => {
        const fx = new Fx(done, { lazy: true });
        fx.scheduleRun();
      });

      it('with scheduler', (done) => {
        function scheduler(run) {
          setTimeout(() => {
            run('hello', 100, false);
            done();
          }, 1);
        }

        const fx = new Fx((...args) => {
          assert.deepEqual(args, [ 'hello', 100, false ]);
        }, { lazy: true, scheduler });

        fx.scheduleRun();
      });
    });

    describe('#run()', () => {
      it('inactive fx', () => {
        const fx = new Fx((...args) => {
          assert.deepEqual(args, [ 3, 'test', true ]);
          return 'hello';
        }, { lazy: true });

        fx.active = false;
        const res = fx.run(3, 'test', true);
        assert.equal(res, 'hello');
      });
    });

    describe('#stop()', () => {
      it('should set active to false', () => {
        const fx = new Fx(() => {});
        assert.equal(fx.active, true);

        fx.stop();
        assert.equal(fx.active, false);
      });
    });

    describe('#cleanup()', () => {
      it('should set active to false', () => {
        const fx = new Fx(() => {});
        assert.equal(fx.active, true);

        fx.stop();
        assert.equal(fx.active, false);
      });
    });

    describe('tracking', () => {
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
  });
});
