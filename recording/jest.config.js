
const { createDefaultPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
  rootDir:'.',
  testEnvironment: "node",
  testTimeout: 10000,
  transform: {
    ...tsJestTransformCfg,
  },
  testPathIgnorePatterns:["<rootDir>/dist/"],
  moduleNameMapper:{
    '^src/(.*)$': '<rootDir>/src/$1'
  }
};