import config from '@iobroker/eslint-config';

export default [
    ...config,
    {
        languageOptions: {
            parserOptions: {
                allowDefaultProject: {
                    allow: ['*.js', '*.mjs', 'src/harmony.test.ts'],
                },
                tsconfigRootDir: import.meta.dirname,
                project: './tsconfig.json',
                // projectService: true,
            },
        },
    },
    {
        // disable temporary the rule 'jsdoc/require-param' and enable 'jsdoc/require-jsdoc'
        rules: {
            'jsdoc/require-jsdoc': 'off',
            'jsdoc/require-param': 'off',
        },
    },
    {
        ignores: ['**/*.js', 'build/**/*', '*.mjs', 'test/**/*.js'],
    },
];
