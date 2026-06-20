const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { join } = require('path');

module.exports = {
  output: {
    path: join(__dirname, '../../dist/apps/server'),
    clean: true,
    ...(process.env.NODE_ENV !== 'production' && {
      devtoolModuleFilenameTemplate: '[absolute-resource-path]',
    }),
  },
  plugins: [
    new NxAppWebpackPlugin({
      target: 'node',
      compiler: 'tsc',
      main: './src/main.ts',
      tsConfig: './tsconfig.app.json',
      assets: [
        './src/assets',
        {
          input: 'libs/database/src/migrations',
          glob: '**/*',
          output: 'migrations',
        },
      ],
      optimization: false,
      outputHashing: 'none',
      generatePackageJson: true,
      sourceMap: true,
      // Bundle workspace libs (@nuraskin/*) into the output.
      // The production Docker image has no monorepo node_modules, so
      // workspace packages must be inlined — not externalized.
      // Third-party deps remain external (npm install handles them).
      externalDependencies: 'none',
    }),
  ],
};
