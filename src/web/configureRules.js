/*
 * Copyright 2016 Dialog LLC <info@dlg.im>
 * @flow
 */

const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const resolve = require('../utils/resolve');
const configurePostCSS = require('./configurePostCSS');
import type { WebOptions } from '../types';

function toArray<T>(value: ?(T | Array<T>)): Array<T> {
  if (value) {
    if (Array.isArray(value)) {
      return value;
    }

    return [value];
  }

  return [];
}

function configureModuleRules(options: WebOptions) {
  const rules = [];

  const valFiles = [
    ...toArray(options.paths.valFiles),
    resolve(
      options.root,
      'node_modules/@dlghq/dialog-web-core/src/messages-generate.js',
    ),
  ];

  rules.push({
    test: valFiles,
    loader: 'val-loader',
  });

  rules.push({
    test: /\.js$/,
    loader: 'babel-loader',
    options: {
      babelrc: false,
      cacheDirectory: true,
      presets: [
        [
          '@dlghq/dialog',
          {
            modules: false,
            optimize: options.environment === 'production',
            development: options.environment === 'development',
          },
        ],
      ],
    },
    include: [
      ...toArray(options.paths.js),
      resolve(options.root, 'node_modules/@dlghq'),
      resolve(options.root, 'node_modules/@dlghq/dialog-web-core'),
      resolve(options.root, 'node_modules/@dlghq/dialog-components'),
    ],
    exclude: [
      ...valFiles,
      resolve(options.root, 'node_modules/@dlghq/dialog-java-core'),
      resolve(options.root, 'node_modules/@babel'),
    ],
  });

  rules.push({
    test: /\.worker\.js$/,
    use: [
      'worker-loader',
      {
        loader: 'babel-loader',
        options: {
          babelrc: false,
          cacheDirectory: true,
          presets: [
            [
              '@dlghq/dialog',
              {
                modules: false,
                optimize: options.environment === 'production',
                development: options.environment === 'development',
              },
            ],
          ],
        },
      },
    ],
    include: [
      ...toArray(options.paths.js),
      resolve(options.root, 'node_modules/@dlghq'),
      resolve(options.root, 'node_modules/@dlghq/dialog-web-core'),
      resolve(options.root, 'node_modules/@dlghq/dialog-components'),
    ],
    exclude: [
      ...valFiles,
      resolve(options.root, 'node_modules/@dlghq/dialog-java-core'),
      resolve(options.root, 'node_modules/@babel'),
    ],
  });

  if (options.environment === 'production') {
    // global
    rules.push({
      test: /\.css$/,
      use: [
        {
          loader: MiniCssExtractPlugin.loader,
        },
        {
          loader: 'css-loader',
          options: {
            modules: false,
            importLoaders: 1,
          },
        },
        configurePostCSS(options),
      ],
      include: [
        ...toArray(options.paths.styles),
        resolve(
          options.root,
          'node_modules/@dlghq/dialog-web-core/src/styles/global.css',
        ),
      ],
    });

    // css-modules
    rules.push({
      test: /\.css$/,
      use: [
        {
          loader: MiniCssExtractPlugin.loader,
        },
        {
          loader: 'css-loader',
          options: {
            modules: true,
            importLoaders: 1,
            localIdentName: `${options.cssPrefix}-[sha1:hash:hex]`,
          },
        },
        configurePostCSS(options),
      ],
      include: [
        ...toArray(options.paths.cssModules),
        resolve(options.root, 'node_modules/@dlghq'),
        resolve(options.root, 'node_modules/@dlghq/dialog-web-core'),
        resolve(options.root, 'node_modules/@dlghq/dialog-components'),
      ],
      exclude: [
        ...toArray(options.paths.styles),
        resolve(
          options.root,
          'node_modules/@dlghq/dialog-web-core/src/styles/global.css',
        ),
      ],
    });
  } else {
    // global
    rules.push({
      test: /\.css$/,
      use: [
        'style-loader',
        {
          loader: 'css-loader',
          options: {
            modules: false,
            importLoaders: 1,
          },
        },
        configurePostCSS(options),
      ],
      include: [
        ...toArray(options.paths.styles),
        resolve(
          options.root,
          'node_modules/@dlghq/dialog-web-core/src/styles/global.css',
        ),
      ],
    });

    // app css-modules
    rules.push({
      test: /\.css$/,
      use: [
        'style-loader',
        {
          loader: 'css-loader',
          options: {
            modules: true,
            importLoaders: 1,
            localIdentName: `${options.cssPrefix}-[name]-[local]`,
          },
        },
        configurePostCSS(options),
      ],
      include: [...toArray(options.paths.cssModules)],
      exclude: [...toArray(options.paths.styles)],
    });

    // dialog sdk
    rules.push({
      test: /\.css$/,
      use: [
        'style-loader',
        {
          loader: 'css-loader',
          options: {
            modules: true,
            importLoaders: 1,
            localIdentName: 'DialogSDK-[name]-[local]',
          },
        },
        configurePostCSS(options),
      ],
      include: [resolve(options.root, 'node_modules/@dlghq/dialog-web-core')],
      exclude: [
        resolve(
          options.root,
          'node_modules/@dlghq/dialog-web-core/src/styles/global.css',
        ),
      ],
    });

    // dialog components
    rules.push({
      test: /\.css$/,
      use: [
        'style-loader',
        {
          loader: 'css-loader',
          options: {
            modules: true,
            importLoaders: 1,
            localIdentName: 'DialogComponents-[name]-[local]',
          },
        },
        configurePostCSS(options),
      ],
      include: [resolve(options.root, 'node_modules/@dlghq/dialog-components')],
    });
  }

  rules.push({
    test: /\.yml$/,
    loader: 'yml-loader',
  });

  const icons = [
    resolve(
      options.root,
      'node_modules/@dlghq/dialog-components/src/components/Icon/svg',
    ),
  ];

  rules.push({
    test: /\.(svg|png|gif|jpe?g|ttf|eot|woff2?|mp3)$/,
    loader: 'file-loader',
    options: {
      name: '[sha1:hash:hex].[ext]',
    },
    exclude: [...icons],
  });

  rules.push({
    test: /\.svg$/,
    loader: 'svg-sprite-loader',
    include: [...icons],
  });

  return rules;
}

module.exports = configureModuleRules;
