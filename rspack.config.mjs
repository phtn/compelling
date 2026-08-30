import path from 'node:path'
import { fileURLToPath } from 'node:url'
import rspack from '@rspack/core'
import { beastOctane } from 'beast-tsrx/rspack'

const root = path.dirname(fileURLToPath(import.meta.url))

export default (_, { mode = 'production' } = {}) => ({
  context: root,
  mode,
  entry: './src/main.ts',
  output: {
    path: path.resolve(root, 'dist'),
    filename: 'assets/[name].[contenthash:8].js',
    publicPath: '/',
    clean: true,
  },
  devtool: mode === 'production' ? false : 'source-map',
  resolve: {
    extensions: ['.btsx', '.ts', '.tsx', '.tsrx', '.js', '.json'],
    alias: {
      '@@': root,
      '@': path.resolve(root, 'src'),
    },
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: [rspack.CssExtractRspackPlugin.loader, 'css-loader', 'postcss-loader'],
      },
      {
        test: /\.tsx?$/i,
        exclude: /node_modules/,
        use: {
          loader: 'builtin:swc-loader',
          options: {
            jsc: {
              parser: { syntax: 'typescript', tsx: true },
            },
          },
        },
      },
    ],
  },
  plugins: [
    beastOctane(),
    new rspack.HtmlRspackPlugin({
      template: './index.html',
      favicon: './favicon.ico',
    }),
    new rspack.CssExtractRspackPlugin({
      filename: 'assets/[name].[contenthash:8].css',
    }),
    new rspack.CopyRspackPlugin({
      patterns: [{ from: 'public', to: '.' }],
    }),
  ],
  devServer: {
    port: 5173,
    hot: true,
    historyApiFallback: true,
    static: { directory: path.resolve(root, 'public') },
  },
})
