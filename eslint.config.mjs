import config from '@iobroker/eslint-config';

export default [
    ...config,
    {
        languageOptions: {
            parserOptions: {
                // allowDefaultProject belongs inside projectService. At the top level it is
                // ignored, every file falls back to the default project, and types from
                // @types/node resolve to the 'error' type — which then trips
                // no-redundant-type-constituents on every NodeJS.Timeout etc.
                projectService: {
                    allowDefaultProject: ['*.js', '*.mjs'],
                },
                tsconfigRootDir: import.meta.dirname,
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
