/* eslint-env node */
require('@rushstack/eslint-patch/modern-module-resolution')

module.exports = {
  root: true,
  extends: [
    'plugin:vue/vue3-recommended',
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    '@vue/eslint-config-typescript/recommended',
    '@vue/eslint-config-prettier/skip-formatting'
  ],
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@typescript-eslint/parser',
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json', './tsconfig.node.json'],
    tsconfigRootDir: __dirname,
    extraFileExtensions: ['.vue']
  },
  ignorePatterns: ['.eslintrc.cjs', 'dist', 'node_modules'],
  rules: {
    // Line length
    'max-len': ['error', { 
      code: 120, 
      ignoreComments: true,
      ignoreStrings: true,
      ignoreTemplateLiterals: true,
      ignoreRegExpLiterals: true 
    }],
    
    // General rules
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    'no-var': 'error',
    'prefer-const': 'error',
    'prefer-arrow-callback': 'error',
    'eqeqeq': ['error', 'always'],
    'curly': ['error', 'all'],
    
    // TypeScript rules
    '@typescript-eslint/no-unused-vars': ['error', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_' 
    }],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/no-misused-promises': 'error',
    '@typescript-eslint/await-thenable': 'error',
    '@typescript-eslint/no-unnecessary-type-assertion': 'error',
    '@typescript-eslint/prefer-as-const': 'error',
    '@typescript-eslint/consistent-type-imports': ['error', { 
      prefer: 'type-imports' 
    }],
    // Relax rules for external library types
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/no-unsafe-call': 'off',
    '@typescript-eslint/no-unsafe-argument': 'off',
    '@typescript-eslint/restrict-template-expressions': 'off',
    
    // Vue rules
    'vue/multi-word-component-names': 'off',
    'vue/no-unused-components': 'error',
    'vue/no-unused-vars': 'error',
    'vue/component-tags-order': ['error', {
      'order': ['script', 'template', 'style']
    }],
    'vue/block-tag-newline': 'error',
    'vue/component-name-in-template-casing': ['error', 'PascalCase'],
    'vue/define-props-declaration': ['error', 'type-based'],
    'vue/define-emits-declaration': ['error', 'type-based'],
    'vue/no-empty-component-block': 'error',
    'vue/padding-line-between-blocks': 'error',
    'vue/prefer-separate-static-class': 'error',
    'vue/prefer-true-attribute-shorthand': 'error',
    'vue/v-on-function-call': ['error', 'never'],
    'vue/no-useless-v-bind': 'error',
    'vue/no-useless-mustaches': 'error',
    'vue/no-constant-condition': 'warn',
    'vue/require-macro-variable-name': 'error',
    'vue/valid-define-options': 'error',
    'vue/block-lang': ['error', {
      'script': { 'lang': 'ts' }
    }]
  }
}