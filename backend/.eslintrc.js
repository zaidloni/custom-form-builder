module.exports = {
  root: true,
  overrides: [
    {
      files: ['**/*.ts', '*.ts', '*.js'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaVersion: 12,
        sourceType: 'module',
      },
      plugins: ['@typescript-eslint'],
      extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
      rules: {
        quotes: ['error', 'single', { avoidEscape: false }],
        semi: ['error', 'never'],
        'no-useless-escape': 'off',
        eqeqeq: ['error', 'smart'],
        'no-console': 'error',
        camelcase: ['off'],
        'no-extra-bind': ['error'],
        'no-multi-spaces': ['error'],
        'arrow-spacing': ['error', { before: true, after: true }],
        'arrow-parens': ['error', 'as-needed'],
        'no-var': 'error',
        'comma-spacing': ['error', { before: false, after: true }],
        '@typescript-eslint/no-explicit-any': 'off',
      },
      env: {
        es2021: true,
        node: true,
      },
    },
  ],
}
