import typescript from 'rollup-plugin-typescript2';
import { terser } from 'rollup-plugin-terser';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import pkg from './package.json';

function terserKeepComments(node, { type, value }) {
  if (type == "comment2") {
    // multiline comment
    return /@preserve|@license|@cc_on/i.test(value);
  }
}

export default {
  input: 'src/index.ts',
  output: [
    { file: pkg.main, format: 'cjs', sourcemap: true },
    { file: pkg.module, format: 'es', sourcemap: true },
  ],
  plugins: [
    resolve(),
    json(),
    typescript({ typescript: require('typescript'), clean: true }),
    terser({
      output: { comments: terserKeepComments }
    })
  ],
}
