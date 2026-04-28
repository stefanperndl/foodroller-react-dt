module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/app/**',
    '!src/index.js',
    '!src/setupTests.js',
  ],
  coverageThreshold: {
    global: {
      lines: 60,
      functions: 50,
    },
  },
};
