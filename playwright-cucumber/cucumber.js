const common = {
  requireModule: ['ts-node/register'],
  require: ['src/steps/**/*.ts', 'src/support/**/*.ts'],
  paths: ['features/**/*.feature'],
  format: ['progress-bar', 'html:reports/cucumber-report.html'],
};

module.exports = {
  default: common,
};
