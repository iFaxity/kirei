/// <reference types="cypress" />
import { clearNode, persistent, diff, createTemplate } from '@kirei/html/dist/shared';

function createDiffable(preNodes, nodes, postNodes) {
  const node = document.createElement('div');
  const ref = document.createComment('');
  function pushNodes(nodes) {
    Array.isArray(nodes) && nodes.forEach(n => node.appendChild(n));
  }

  pushNodes(preNodes);
  pushNodes(nodes);
  node.appendChild(ref);
  pushNodes(postNodes);
  return [ ref, node ];
}

function createNodes(count) {
  return [...Array(count)].map(() => document.createElement('p'));
}

function assertNodes(node, nodes) {
  assert.equal(node.childNodes.length, nodes.length);

  for (let i = 0; i < nodes.length; i++) {
    assert.equal(node.childNodes[i], nodes[i], `Child node at index ${i} does not match`);
  }
}

describe('@kirei/html/shared', () => {
  describe('#clearNode()', () => {
    it('with node', () => {
      const node = document.createElement('div');
      createNodes(3).forEach(n => node.appendChild(n));

      assert.equal(node.childNodes.length, 3);
      clearNode(node);
      assert.equal(node.childNodes.length, 0);
    });
    it('with fragment', () => {
      const frag = document.createDocumentFragment();
      createNodes(7).forEach(n => frag.appendChild(n));

      assert.equal(frag.childNodes.length, 7);
      clearNode(frag);
      assert.equal(frag.childNodes.length, 0);
    });
    it('with body', () => {
      const { body } = document;
      createNodes(4).forEach(n => body.appendChild(n));

      assert.isAtLeast(body.childNodes.length, 4);
      clearNode(body);
      assert.equal(body.childNodes.length, 0);
    });
    it('with leaf node', () => {
      const node = document.createElement('p');

      assert.isEmpty(node.textContent);
      clearNode(node);
      assert.isEmpty(node.textContent);
      assert.equal(node.childNodes.length, 0);
    });
    it('with text node', () => {
      const node = document.createTextNode('123');
      assert.isNotEmpty(node.textContent);

      clearNode(node);
      assert.isNotEmpty(node.textContent);
    });
    it('with comment', () => {
      const node = document.createComment('Bye');
      assert.isNotEmpty(node.textContent);

      clearNode(node);
      assert.isNotEmpty(node.textContent);
    });
  });

  describe('#persistent()', () => {
    it('with leaf fragment', () => {
      const wire = persistent(document.createDocumentFragment());
      assert.isUndefined(wire);
    });
    it('with one child', () => {
      const frag = document.createDocumentFragment();
      frag.appendChild(document.createElement('div'));

      const wire = persistent(frag);
      assert.instanceOf(wire, HTMLDivElement);
    });
    it('with multiple children', () => {
      const frag = document.createDocumentFragment();
      createNodes(5).forEach(n => frag.appendChild(n));

      const wire = persistent(frag);
      assert.equal(wire.nodeType, 123);
    });

    it('multiple DOM mounting', () => {
      const frag = document.createDocumentFragment();
      createNodes(5).forEach(n => frag.appendChild(n));

      const root1 = document.createElement('div');
      const root2 = document.createElement('div');
      const wire = persistent(frag);

      assert.isEmpty([...root1.childNodes]);
      assert.isEmpty([...root2.childNodes]);
      assert.isNotEmpty([...frag.childNodes]);

      root1.appendChild(wire.valueOf());
      assert.equal(root1.childNodes.length, 5);
      assert.isEmpty([...frag.childNodes]);

      root2.appendChild(wire.valueOf());
      assert.isEmpty([...root1.childNodes]);
      assert.equal(root2.childNodes.length, 5);
    });
  });

  describe('#diff()', () => {
    it('fill node', () => {
      const newNodes = createNodes(10);
      const [ ref, parent ] = createDiffable();
      const res = diff(ref, [], newNodes);

      assert.deepEqual(res, newNodes);
      assertNodes(parent, [ ...newNodes, ref ]);
    });
    it('swap nodes', () => {
      const oldNodes = createNodes(10);
      const newNodes = createNodes(15);
      const [ ref, parent ] = createDiffable(null, oldNodes);
      const res = diff(ref, oldNodes, newNodes);

      assert.deepEqual(res, newNodes);
      assertNodes(parent, [ ...newNodes, ref ]);
    });
    it('drain node', () => {
      const oldNodes = createNodes(10);
      const [ ref, parent ] = createDiffable(null, oldNodes);
      const res = diff(ref, oldNodes, []);

      assert.isEmpty(res);
      assertNodes(parent, [ ref ]);
    });
    it('diff persistent node', () => {
      const frag = document.createDocumentFragment();
      const fragNodes = createNodes(5);
      fragNodes.forEach(n => frag.appendChild(n));

      const newNodes = createNodes(14);
      const oldNodes = createNodes(10);
      const [ ref, parent ] = createDiffable(null, oldNodes);
      const res = diff(ref, oldNodes, [...newNodes, persistent(frag)]);

      assert.equal(res.length, newNodes.length + 1);
      assertNodes(parent, [...newNodes, ...fragNodes, ref]);
    });
  });

  describe('#createTemplate()', () => {
    it('with html type', () => {
      const tpl = createTemplate(false, '<h1>Title</h1><p>Text</p>');

      assert.instanceOf(tpl, HTMLTemplateElement);
      assert.equal(tpl.content.childNodes.length, 2);
      assert.instanceOf(tpl.content.firstChild, HTMLHeadingElement);
      assert.instanceOf(tpl.content.childNodes[1], HTMLParagraphElement);
    });
    it('with svg type', () => {
      const tpl = createTemplate(true, '<circle r=100 />');

      assert.instanceOf(tpl, HTMLTemplateElement);
      assert.equal(tpl.content.childNodes.length, 1);
      assert.instanceOf(tpl.content.firstChild, SVGCircleElement);
    });

    it('invalid svg', () => {
      const tpl = createTemplate(false, '<circle r=100 />');

      assert.instanceOf(tpl, HTMLTemplateElement);
      assert.equal(tpl.content.childNodes.length, 1);
      assert.instanceOf(tpl.content.firstChild, HTMLUnknownElement);
    });
  });
});
