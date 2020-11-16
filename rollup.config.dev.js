import ts from '@rollup/plugin-typescript'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import babel from 'rollup-plugin-babel'
import livereload from 'rollup-plugin-livereload'
import serve from 'rollup-plugin-serve'

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'examples/lucky-canvas.umd.min.js',
      format: 'umd',
      name: 'LuckDraw',
    },
  ],
  plugins: [
    ts(),
    resolve(),
    commonjs(),
    babel({ exclude: 'node_modules/**' }),
    livereload(),
    serve({
      open: true,
      port: 8888,
      contentBase: ''
    })
  ]
}
