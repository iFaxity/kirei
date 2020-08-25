import type { Transform, Plugin } from 'vite';
import { transformSync, PluginItem } from '@babel/core';
import BabelPluginKirei from 'babel-plugin-kirei';
import compileExclude from 'babel-plugin-kirei/dist/exclude';

/**
 * @interface
 */
interface KireiPluginOptions {
  include?: string|string[];
  exclude?: string|string[];
  extension?: string|string[];
  cwd?: string;
  plugins?: PluginItem[];
}

/**
 * Creates a new Vite plugin for instrumenting HMR for Kirei elements
 * @param {KireiPluginOptions} opts
 * @returns {Plugin}
 */
function kireiPlugin(opts: KireiPluginOptions = {}): Plugin {
  let exclude: (filename: string) => boolean;
  const cwd = process.cwd();
  const plugins: PluginItem[] = [
    // Add kirei plugin first, disable guard as we guard in the vite plugin
    [ BabelPluginKirei, { harmony: true, guard: false, }],
  ];

  if (Array.isArray(opts.plugins)) {
    plugins.push(...opts.plugins);
  }

  const transform: Transform = {
    test(ctx) {
      if (ctx.isBuild || process.env.NODE_ENV == 'production') {
        // do not transform for production builds
        return false;
      } else if (ctx.path.startsWith('/@modules/') || ctx.path.includes('node_modules')) {
        // do not transform if this is a dep
        return false;
      } else if (!exclude) {
        exclude = compileExclude(opts);
      }

      return !exclude(ctx.path);
    },
    transform(ctx) {
      const { code, map } = transformSync(ctx.code, {
        plugins, cwd,
        ast: false,
        sourceMaps: true,
        filename: ctx.path,
      });

      return { code, map };
    },
  };

  return { transforms: [ transform ] };
}

export = kireiPlugin;
