/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/tests'],
    testMatch: ['**/*.test.ts'],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
    transform: {
        '^.+\\.ts$': ['ts-jest', {
            diagnostics: false,
        }],
    },
    moduleNameMapper: {
        '^isomorphic-dompurify$': '<rootDir>/tests/__mocks__/isomorphic-dompurify.ts',
    },
};
