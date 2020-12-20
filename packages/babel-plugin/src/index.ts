import { relative } from 'path';
import { types as t, BabelFile, ConfigAPI, PluginObj } from '@babel/core';
import { declare } from '@babel/helper-plugin-utils';

import { assignVarExpr, callExpr, declareVar, generateUids, importNamespace, variableExpr } from './node';
import { compileExclude } from './exclude';

const TARGET_MODULE_NAME = '@kirei/element';
const HMR_MODULE_PATH = '@kirei/hmr-api';
const DEFINE_ELEMENT_FN = 'defineComponent';

interface PluginOptions {
  opts?: {
    target?: string;
    harmony?: boolean;
    include?: string|string[];
    exclude?: string|string[];
    extension?: string|string[];
    guard?: boolean;
  };

  file?: BabelFile;
}

/**
 * Main babel plugin
 * @param fn - Function to call when plugin is created
 * @returns The created Babel plugin
 */
export default declare((api: ConfigAPI) => {
  api.assertVersion(7);
  let definitions: { oid: string, eid: string, expr: t.Expression } [] = [];
  let exportNodes: t.ExportDeclaration[] = [];
  let filepath: string;
  let skip: boolean = false;
  let exclude: (filename: string) => boolean;

  // disable plugin in production and test
  const { NODE_ENV } = process.env;
  if (NODE_ENV === 'production' || NODE_ENV === 'test') {
    return { visitor: {} };
  }

  // TODO: make this more readable, maybe use parser for some
  return {
    name: 'kirei',
    visitor: {
      Program: {
        enter(_, { file, opts }) {
          // init state
          const { cwd, filenameRelative, filename } = file.opts;
          definitions = [];
          exportNodes = [];
          filepath = filenameRelative ?? relative(cwd, filename);

          if (opts.guard !== false) {
            if (!exclude) {
              exclude = compileExclude(opts);
            }

            skip = exclude(filepath);
          }
        },
        exit(path, { opts }) {
          // if elements populated, generate HMR code
          if (skip || !definitions.length) {
            return;
          }

          const meta = opts.harmony ? 'import.meta' : 'module';
          const hmrAPI = path.scope.generateUid('hmr');
          const hmrID = path.scope.generateUid('hmrId');

          path.node.body.push(
            importNamespace(hmrAPI, HMR_MODULE_PATH),
            declareVar('const', hmrID, t.stringLiteral(filepath)),
            ...definitions.map(({ oid, expr }) => declareVar('let', oid, expr)),

            t.ifStatement(
              variableExpr(`${meta}.hot`),
              t.blockStatement([
                t.expressionStatement(callExpr(`${meta}.hot.accept`, [])),
                // hmr createOrUpdate
                ...definitions.map(({ oid, eid }) => {
                  path.scope.generateUid();
                  return assignVarExpr('=', eid, callExpr(`${hmrAPI}.createOrUpdate`, [
                    t.identifier(hmrID),
                    t.identifier(oid),
                  ]));
                }),
              ]),

              t.blockStatement([
                // hmr create
                ...definitions.map(({ oid, eid }) => {
                  return assignVarExpr('=', eid, callExpr(`${hmrAPI}.create`, [
                    t.identifier(hmrID),
                    t.identifier(oid),
                  ]));
                }),
              ])
            ),
            ...exportNodes,
          );
        },
      },

      // Get function name of definer
      ImportDeclaration(path, { opts }) {
        const target = opts?.target ?? TARGET_MODULE_NAME;
        if (skip || path.node.source.value !== target) {
          return;
        }

        // remove defineComponent import from @kirei/element
        const { specifiers } = path.node;
        for (let idx = 0; idx < specifiers.length; idx++) {
          const s = specifiers[idx];
          if (t.isImportSpecifier(s) && t.isIdentifier(s.imported) && s.imported.name === DEFINE_ELEMENT_FN) {
            specifiers.splice(idx, 1);
          }
        }
      },

      CallExpression(path) {
        if (skip || !t.isIdentifier(path.node.callee, { name: DEFINE_ELEMENT_FN })) {
          return;
        }

        const arg = path.node.arguments[0] as t.Expression;

        if (t.isExportDefaultDeclaration(path.parent)) {
          // Default export expression, declare placeholder var and move to bottom
          const [ eid, oid ] = generateUids(path);
          definitions.push({ eid, oid, expr: arg });

          path.replaceWith(t.identifier(eid));
          path.parentPath.replaceWith(declareVar('let', eid));
          exportNodes.push(path.parent);
          return;
        } else if (t.isVariableDeclarator(path.parent)) {
          // if export in top of node, add to exportNodes and remove
          let parent = path.findParent(n => t.isExportDeclaration(n));

          // Export expression, declare placeholder var and move to bottom
          if (parent) {
            const [ eid, oid ] = generateUids(path);
            definitions.push({ eid, oid, expr: arg });

            path.replaceWith(t.identifier(eid));
            exportNodes.push(parent.node as t.ExportDeclaration);
            parent.replaceWith(declareVar('let', eid));
            return;
          }

          // Pure var declaration, insert mutable vardeclaration above
          parent = path.findParent(n => t.isVariableDeclaration(n));
          if (parent) {
            const [ eid, oid ] = generateUids(path);
            definitions.push({ eid, oid, expr: arg });

            parent.insertBefore(declareVar('let', eid));
            path.replaceWith(t.identifier(eid));
            return;
          }
        }

        path.remove();
      },
    },
  } as PluginObj<PluginOptions>;
})
