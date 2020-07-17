/// <reference types="cypress" />
import { isCollection } from '@kirei/fx/dist/shared';

describe('shared', () => {
  describe('#isCollection()', () => {
    it('with Map', () => {
      assert(isCollection(new Map()));
    });
    it('with WeakMap', () => {
      assert(isCollection(new WeakMap()));
    });
    it('with Set', () => {
      assert(isCollection(new Set()));
    });
    it('with WeakSet', () => {
      assert(isCollection(new WeakSet()));
    });
    it('with object', () => assert(!isCollection({})));
    it('with array', () => assert(!isCollection([])));
    it('with null', () => assert(!isCollection(null)));
    it('with number', () => assert(!isCollection(10)));
  });
})
