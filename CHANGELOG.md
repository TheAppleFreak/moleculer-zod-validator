# CHANGELOG

## 3.0.0 (2023/4/13)

* Added support for passing in fastest-validator schemas. This is required because the `$node` internal services built into Moleculer assume that fastest-validator is the current validator, which poses a problem given as moleculer-zod-validator had no idea what to do with those schemas. By checking for the existence of property in the Zod schema that is not used in fastest-validator, this can now automatically switch into a failsafe that uses fastest-validator instead. 
* **BREAKING CHANGE** - The minimum compatible Node.js version is now Node.js v17.0.0. This is due to the requirement of the `structuredClone` function in the fastest-validator fallback, which in Node.js is only available in v17.0.0 and above. I tried using Lodash's `cloneDeep` method like Moleculer itself uses, but for a reason unknown to me it kept causing crashes during unit testing that I couldn't figure out. `structuredClone` does work, however, which should solve the same problem. 
* Added new unit tests for the FV fallback
* Added some files to the NPM build that should have been present before
* Updated dependencies
* Updated Github workflows to use newer Node.js versions
* Updated copyright year in LICENSE

## 2.0.0 (2022/1/24)

* Added transformation support to the validator itself, which will allow for features such as defaults and different passthrough modes for unrecognized parameters. This has several side effects that are listed below.
  * **BREAKING CHANGE** - Removed the `compiledValidatorOnly` nested options object. The two settings, `strip` and `passthrough`, are now present in the top level options object.
  * **BREAKING CHANGE** - The default validation mode is now `strip` as opposed to `passthrough`. 

## 1.0.2 (2022/1/17)

* Fixed package.json and continuous integration scripts to actually include the build this time, for real

## 1.0.1 (2022/1/17)

* Fixed package.json and continuous integration scripts to actually include the build this time

## 1.0.0 (2022/1/17)

* Initial release