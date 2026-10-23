# Changelog

## [1.1.0](https://github.com/developmentseed/openeo-studio/compare/v1.0.1...v1.1.0) (2026-10-23)


### Features

* add property filters for collection queryables and enhance cloud cover handling ([7c01ba9](https://github.com/developmentseed/openeo-studio/commit/7c01ba90f7e9a1b3848bd1963d0308653b2a5b7f))
* agent discovery docs (llms.txt) and prefill links for the editor ([#151](https://github.com/developmentseed/openeo-studio/issues/151)) ([9a13894](https://github.com/developmentseed/openeo-studio/commit/9a1389450710ae50a12cd6dfadd1e8c63c454308))
* **auth:** implement OpenID Connect support and error handling ([a6cc410](https://github.com/developmentseed/openeo-studio/commit/a6cc410aa051ff57bb5f31fc11d8e870dc0146f0))
* **editor:** replace CollectionDisplay with CollectionSelector and enhance band handling ([9b28aca](https://github.com/developmentseed/openeo-studio/commit/9b28acaca0866ee9ea9cbfe317974315e1d4c822))
* remove CloudCoverSlider component to streamline editor setup ([6ed0406](https://github.com/developmentseed/openeo-studio/commit/6ed0406af77564f3236e2c80002dc138b66c6187))
* **tests:** mock backend OIDC configuration for integration tests ([41f4b64](https://github.com/developmentseed/openeo-studio/commit/41f4b64b0917a32e36522a4ab86cec4a4dbdb5e2))
* update release process and versioning for openeo-studio ([#135](https://github.com/developmentseed/openeo-studio/issues/135)) ([080c2b0](https://github.com/developmentseed/openeo-studio/commit/080c2b0c97f914c1fdbdab1156a16c08546083f1))


### Bug Fixes

* **bands:** use the editor band list for collection compatibility ([bca7fe9](https://github.com/developmentseed/openeo-studio/commit/bca7fe99c3e09b8b5146fc0120371cde75465b66))
* clear tile errors of hidden layers and of old views ([0abdf72](https://github.com/developmentseed/openeo-studio/commit/0abdf72f3d585082e382b4c7788b028c9cabdc4b))
* **filters:** address review comments on property filters ([5754490](https://github.com/developmentseed/openeo-studio/commit/575449055786ed0c5285888434353dd88468f535))
* show tile errors, and document reflectance and extent sizing ([872451b](https://github.com/developmentseed/openeo-studio/commit/872451bd70d2b9a971e9973461d3c5f8b299686f))
* show tile errors, and document reflectance and extent sizing ([#156](https://github.com/developmentseed/openeo-studio/issues/156)) ([fbc8cf5](https://github.com/developmentseed/openeo-studio/commit/fbc8cf559206e2e6d842ba8d522a99adc6a9c4be))


### Documentation

* **agents:** describe property filters and the optional cloudCover ([3268bb9](https://github.com/developmentseed/openeo-studio/commit/3268bb922f9435bd517f2ffbd9c7fe5855025be2))


### Code Refactoring

* replace deprecated cloudCover field with propertyFilters for cloud cover ([dc23c4f](https://github.com/developmentseed/openeo-studio/commit/dc23c4ffcc2d37298dd7930f34657f89d087eaed))
