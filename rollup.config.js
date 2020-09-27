import { terser } from 'rollup-plugin-terser';
import resolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import typescript from '@rollup/plugin-typescript';

export default {
  input: './packages/element/dist/index.js',
  output: {
    file: './packages/element/dist/kirei.global.js',
    format: 'umd',
    name: 'Kirei',
  },
  plugins: [
    replace({
      'process.env.NODE_ENV': `'development'`,
    }),
    resolve(),
    terser({ warnings: true }),
  ],
  onwarn: (msg, warn) => {
    if (!/Circular/.test(msg)) {
      warn(msg)
    }
  },
  treeshake: {
    moduleSideEffects: false,
  },
};
