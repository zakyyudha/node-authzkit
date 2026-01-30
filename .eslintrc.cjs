module.exports = {
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint'],
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
    ],
    env: {
        node: true,
        es2022: true,
    },
    rules: {
        '@typescript-eslint/no-explicit-any': 'off', // Common in early dev
        '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
    ignorePatterns: ['dist/', 'node_modules/', 'dashboard/web/', 'src/dashboard/web/'],
};
