# Changelog

## [1.1.0](https://github.com/developmentseed/openeo-studio/compare/v1.0.1...v1.1.0) (2026-11-12)


### Features

* **auth:** implement OpenID Connect support and error handling ([a6cc410](https://github.com/developmentseed/openeo-studio/commit/a6cc410aa051ff57bb5f31fc11d8e870dc0146f0))
* configurable basemaps ([#148](https://github.com/developmentseed/openeo-studio/issues/148)) ([f658ec3](https://github.com/developmentseed/openeo-studio/commit/f658ec381ba459c2efc207c10e43696d5eb30e15))
* **editor:** replace CollectionDisplay with CollectionSelector and enhance band handling ([9b28aca](https://github.com/developmentseed/openeo-studio/commit/9b28acaca0866ee9ea9cbfe317974315e1d4c822))
* **tests:** mock backend OIDC configuration for integration tests ([41f4b64](https://github.com/developmentseed/openeo-studio/commit/41f4b64b0917a32e36522a4ab86cec4a4dbdb5e2))
* update release process and versioning for openeo-studio ([#135](https://github.com/developmentseed/openeo-studio/issues/135)) ([080c2b0](https://github.com/developmentseed/openeo-studio/commit/080c2b0c97f914c1fdbdab1156a16c08546083f1))


### Bug Fixes

* **bands:** use the editor band list for collection compatibility ([bca7fe9](https://github.com/developmentseed/openeo-studio/commit/bca7fe99c3e09b8b5146fc0120371cde75465b66))
* **services:** address review of cleanup bounding ([6532de1](https://github.com/developmentseed/openeo-studio/commit/6532de13a372f41376cb2eed19f37b6f6f89b42e)), closes [#127](https://github.com/developmentseed/openeo-studio/issues/127)
* **services:** bound and stop service cleanup DELETEs ([a40ccad](https://github.com/developmentseed/openeo-studio/commit/a40ccad4d50059c026875edcfb5b6fcc19c76508)), closes [#127](https://github.com/developmentseed/openeo-studio/issues/127)
* **services:** bound service cleanup DELETEs and stop on refusal ([#147](https://github.com/developmentseed/openeo-studio/issues/147)) ([77e16bb](https://github.com/developmentseed/openeo-studio/commit/77e16bb0a6e411046898afc2ba552dcbee78d31b))
