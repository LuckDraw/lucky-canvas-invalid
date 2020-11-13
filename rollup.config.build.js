import ts from '@rollup/plugin-typescript'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import babel from 'rollup-plugin-babel'
import { terser } from 'rollup-plugin-terser'

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/web-luck-draw.cjs.js',
      format: 'cjs',
    },
    {
      file: 'dist/web-luck-draw.cjs.min.js',
      format: 'cjs',
      plugins: [terser()]
    },
    {
      file: 'dist/web-luck-draw.umd.js',
      format: 'umd',
      name: 'LuckDraw',
    },
    {
      file: 'dist/web-luck-draw.umd.min.js',
      format: 'umd',
      name: 'LuckDraw',
      plugins: [terser()]
    },
  ],
  plugins: [
    ts(),
    resolve(),
    commonjs(),
    babel({ exclude: 'node_modules/**' }),
  ]
}
