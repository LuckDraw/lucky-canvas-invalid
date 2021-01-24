import ts from '@rollup/plugin-typescript'
import json from '@rollup/plugin-json'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import babel from 'rollup-plugin-babel'
import livereload from 'rollup-plugin-livereload'
import serve from 'rollup-plugin-serve'
import eslint from '@rollup/plugin-eslint'

export default {
  input: 'src/index.ts',
  output: [
    {
      file: `examples/dev.js`,
      format: 'umd',
      name: 'LuckyCanvas',
    },
  ],
  plugins: [
    ts(),
    json(),
    resolve(),
    commonjs(),
    eslint({
      throwOnError: true,
      throwOnWarning: true,
      include: ['src/**'],
      exclude: ['node_modules/**']
    }),
    babel({ exclude: 'node_modules/**' }),
    livereload(),
    serve({
      open: true,
      port: 8888,
      contentBase: ''
    })
  ]
}
