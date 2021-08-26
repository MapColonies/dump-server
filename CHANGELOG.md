# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [1.2.0](https://github.com/MapColonies/dump-server/compare/v1.1.2...v1.2.0) (2021-08-26)


### Features

* **configurations:** modified chart to match other charts in MapColonies ([#31](https://github.com/MapColonies/dump-server/issues/31)) ([bd34625](https://github.com/MapColonies/dump-server/commit/bd34625d01afc5ff1b491c812d1e9e0e8a788c3c))

### [1.1.2](https://github.com/MapColonies/dump-server/compare/v1.1.1...v1.1.2) (2021-05-25)


### Bug Fixes

* merged ci actions and migrations.Dockerfile image to have python for node-gyp ([52aa5d2](https://github.com/MapColonies/dump-server/commit/52aa5d25c0b0eb921b84ef5278d10661ec3a5c59))

### [1.1.1](https://github.com/MapColonies/dump-server/compare/v1.1.0...v1.1.1) (2021-05-20)


### Bug Fixes

* **dump:** builds correctly url when setting OBJECT_STORAGE_PROJECT_ID ([#29](https://github.com/MapColonies/dump-server/issues/29)) ([5ac8db3](https://github.com/MapColonies/dump-server/commit/5ac8db34616a646399b79435486902fd07c44986))

## [1.1.0](https://github.com/MapColonies/dump-server/compare/v1.0.2...v1.1.0) (2021-05-20)


### Features

* **configurations:** updates openapi3 version on release ([e96a5f0](https://github.com/MapColonies/dump-server/commit/e96a5f0189c97223ef67f0a45bb0a8b1a15bb6d7))


### Bug Fixes

* **helm:** added missing OBJECT_STORAGE_PROJECT_ID variable ([#30](https://github.com/MapColonies/dump-server/issues/30)) ([e73f7d1](https://github.com/MapColonies/dump-server/commit/e73f7d12cc9e552946ab4e8f039c84200433f481))

### [1.0.2](https://github.com/MapColonies/dump-server/compare/v1.0.1...v1.0.2) (2021-05-05)


### Bug Fixes

* **configurations:** ignore no-empty-servers ([b4cf94b](https://github.com/MapColonies/dump-server/commit/b4cf94b6457f69142ef894796191b79d57089525))

### [1.0.1](https://github.com/MapColonies/dump-server/compare/v1.0.0...v1.0.1) (2021-05-05)


### Bug Fixes

* **configurations:** removed servers list from openapi3.yml ([3e05ee9](https://github.com/MapColonies/dump-server/commit/3e05ee908a8f469a1e0534155d87b1f5bf0b51b2))

## 1.0.0 (2021-05-03)


### Features

* **configurations:** changed db schema ([#8](https://github.com/MapColonies/dump-server/issues/8)) ([354e91b](https://github.com/MapColonies/dump-server/commit/354e91b9edb5f50138c272a70c698181d521376a)), closes [#7](https://github.com/MapColonies/dump-server/issues/7) [#7](https://github.com/MapColonies/dump-server/issues/7)
* **configurations:** service can now auth with cert in PG ([#17](https://github.com/MapColonies/dump-server/issues/17)) ([6bda6f9](https://github.com/MapColonies/dump-server/commit/6bda6f95bfe15e1ba69682d5c0c011c0eaeb2d3d))
* **dump:** added dump name uniqueness per bucket ([#24](https://github.com/MapColonies/dump-server/issues/24)) ([d36fed4](https://github.com/MapColonies/dump-server/commit/d36fed4d8f819f65a85757fe41396e5facb4c53f))
* **dump:** added project_id to dump metadata url ([#22](https://github.com/MapColonies/dump-server/issues/22)) ([9b3edbc](https://github.com/MapColonies/dump-server/commit/9b3edbc67ccca542cab2ee5f5517c1b789527450))
* **dump:** create dump metadata endpoint ([#10](https://github.com/MapColonies/dump-server/issues/10)) ([7dfdc87](https://github.com/MapColonies/dump-server/commit/7dfdc877a9249c6652aaa897abf6a85625a813af))
* **helm:** charts compatibility with pg certificate auth ([#19](https://github.com/MapColonies/dump-server/issues/19)) ([ec6007e](https://github.com/MapColonies/dump-server/commit/ec6007eb7717881eb5501c214534ef82bab22e42))
* server payload size is configurable via config file ([#16](https://github.com/MapColonies/dump-server/issues/16)) ([646f37a](https://github.com/MapColonies/dump-server/commit/646f37a85b197e8acf6a6ae0a70ee8e0cbd384cf))
* **dump:** bearer auth middleware for create endpoint ([#14](https://github.com/MapColonies/dump-server/issues/14)) ([3823745](https://github.com/MapColonies/dump-server/commit/382374584329af8b6737b674fd5ca3ea5f5ded51))
* **dump:** server implementation ([#5](https://github.com/MapColonies/dump-server/issues/5)) ([e1e6532](https://github.com/MapColonies/dump-server/commit/e1e65326953440c76698d419824f5e76b6864ee3))
