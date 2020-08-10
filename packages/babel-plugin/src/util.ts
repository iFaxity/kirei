import { types as t, NodePath } from '@babel/core';

export function declareVar(kind: 'const'|'let', id: string, expr?: t.Expression): t.VariableDeclaration {
  const declarator = t.variableDeclarator(t.identifier(id), expr);
  return t.variableDeclaration(kind, [ declarator ]);
}

export function importNamespace(id: string, source: string): t.ImportDeclaration {
  const specifier = t.importNamespaceSpecifier(t.identifier(id));
  return t.importDeclaration([ specifier ], t.stringLiteral(source));
}

export function variableExpr(expr: string): t.MemberExpression {
  const parts = expr.split('.');
  const id = t.identifier(parts.shift());

  return parts.reduce<t.Expression>((acc, part) => {
    return t.memberExpression(acc, t.identifier(part));
  }, id) as t.MemberExpression;
}

export function callExpr(expr: string, args: t.Expression[]): t.CallExpression {
  return t.callExpression(variableExpr(expr), args);
}

export function assignVarExpr(operator: string, name: string, expr: t.Expression): t.ExpressionStatement {
  const assignmentExpr = t.assignmentExpression(operator, t.identifier(name), expr);
  return t.expressionStatement(assignmentExpr);
}

export function generateUids(node: NodePath<t.CallExpression>): [ string, string ] {
  return [ node.scope.generateUid('kireiElement'), node.scope.generateUid('kireiOptions') ];
}
