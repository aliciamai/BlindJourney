module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/app.js',
    '!src/public/**',
  ],
  testMatch: ['**/tests/**/*.test.js'],
  clearMocks: true,
};
