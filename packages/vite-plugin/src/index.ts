import type { Plugin } from 'vite';
import { transformSync, PluginItem } from '@babel/core';
import BabelPluginKirei from 'babel-plugin-kirei';
import TestExclude from 'test-exclude';

interface KireiPluginOptions {
  include?: string|string[];
  exclude?: string|string[];
  extension?: string|string[];
  cwd?: string;
  plugins?: PluginItem[];
}

/**
 * Creates a new Vite plugin for instrumenting HMR for Kirei elements
 * @param opts - Plugin options
 * @returns The created vite plugin
 */
export default function kireiPlugin(opts: KireiPluginOptions = {}): Plugin {
  const cwd = process.cwd();
  const exclude = new TestExclude({
    cwd: opts.cwd,
    include: opts.include,
    exclude: opts.exclude,
    extension: opts.extension,
    excludeNodeModules: true,
  });
  const plugins: PluginItem[] = [
    // Add kirei plugin first, disable guard as we guard in the vite plugin
    [ BabelPluginKirei, { harmony: true, guard: false, }],
  ];

  if (Array.isArray(opts.plugins)) {
    plugins.push(...opts.plugins);
  }

  return {
    name: 'vite:kirei',
    transform(srcCode, id) {
      if (!__DEV__ || id.startsWith('/@modules/')) {
        // do not transform for production builds
        // do not transform if this is a dep
        return;
      }

      if (exclude.shouldInstrument(id)) {
        const { code, map } = transformSync(srcCode, {
          plugins, cwd,
          filename: id,
          ast: false,
          sourceMaps: true,
        });

        return { code, map };
      }
    },
  };
}
