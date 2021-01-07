require('ts-node/register');

exports.config = {
  framework: 'jasmine2',
  specs: [
    './spec/sample.e2e.ts'
  ],
  allScriptsTimeout: 60000,
  defaultTimeoutInterval: 30000,
  directConnect: true,
  capabilities: {
    browserName: 'chrome'
  },
  plugins: [
    { path: './src/index.ts' }
  ]
};
