# Step definitions for BDD Markdown [![npm version](https://img.shields.io/npm/v/@hello.nrfcloud.com/bdd-markdown-steps.svg)](https://www.npmjs.com/package/@hello.nrfcloud.com/bdd-markdown-steps)

[![GitHub Actions](https://github.com/hello-nrfcloud/bdd-markdown-steps/workflows/Test%20and%20Release/badge.svg)](https://github.com/hello-nrfcloud/bdd-markdown-steps/actions)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![Renovate](https://img.shields.io/badge/renovate-enabled-brightgreen.svg)](https://renovatebot.com)
[![@commitlint/config-conventional](https://img.shields.io/badge/%40commitlint-config--conventional-brightgreen)](https://github.com/conventional-changelog/commitlint/tree/master/@commitlint/config-conventional)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier/)
[![ESLint: TypeScript](https://img.shields.io/badge/ESLint-TypeScript-blue.svg)](https://github.com/typescript-eslint/typescript-eslint)

Step definitions for
[BDD Markdown](https://github.com/NordicSemiconductor/bdd-markdown-js).

## Installation

    npm i --save --save-exact @hello.nrfcloud.com/bdd-markdown-steps

## Node & NPM

This project requires Node.js `>=24` and npm `>=12.0.2 <13` (enforced via
`check-node-version` on `npm install` and `npm ci`).

The check is skipped during `npm publish` and `npm pack`, because
`semantic-release` bundles its own npm (`@semantic-release/npm` depends on
`npm@^11.6.2`) and runs the publish with that version rather than the one
installed in CI.
