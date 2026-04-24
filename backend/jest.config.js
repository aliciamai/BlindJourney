module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/app.js',
  ],
  testMatch: ['**/tests/**/*.test.js'],
  clearMocks: true,
};
