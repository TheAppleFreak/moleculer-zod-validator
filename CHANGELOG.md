# CHANGELOG

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