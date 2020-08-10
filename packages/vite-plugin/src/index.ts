import type { Transform, Plugin } from 'vite';
import { transformSync, PluginItem } from '@babel/core';
import BabelPluginKirei from 'babel-plugin-kirei';
import compileSkip from 'babel-plugin-kirei/dist/skip';

interface KireiPluginOptions {
  include?: string|string[];
  exclude?: string|string[];
  extension?: string|string[];
  plugins?: PluginItem[];
}

function kireiPlugin(opts: KireiPluginOptions = {}): Plugin {
  let shouldSkip: (filename: string) => boolean;
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
      } else if (!shouldSkip) {
        shouldSkip = compileSkip(opts);
      }

      return shouldSkip(ctx.path);
    },
    transform(ctx) {
      const { code, map } = transformSync(ctx.code, {
        plugins,
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
