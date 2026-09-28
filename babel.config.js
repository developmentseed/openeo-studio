/* eslint-disable no-undef */

// Jest-only. Our own source is .ts/.tsx and goes through ts-jest (see
// jest.config.js). This exists so babel-jest can transform the handful of
// ESM-only node_modules packages (e.g. lodash-es) that Jest would otherwise
// fail to parse — see transformIgnorePatterns in jest.config.js for which
// packages are actually routed through this.
module.exports = {
  plugins: ['@babel/plugin-transform-modules-commonjs']
};
