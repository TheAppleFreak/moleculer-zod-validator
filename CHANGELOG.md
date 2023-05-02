# CHANGELOG

(all dates use the ISO-8601 format, which is YYYY/MM/DD)

## 3.2.0 (2023/5/2)

* Added support for the `.refine` and `.superRefine` methods. These add additional flexibility for validation. This closes [Issue #7](https://github.com/TheAppleFreak/moleculer-zod-validator/issues/7).
* Added new unit tests for both methods
* Changed GitHub Actions workflows to work with Node 17 (earliest supported) and the current latest version, as opposed to 17 and 18. 

## 3.1.0 (2023/4/21)

* Type inference now works (mostly) as expected! While the runtime behavior of the package worked as expected during work on 3.0.0 and was what I had been testing, I somehow was completely unaware that type inference was completely broken. It's a bit embarrassing for me, to be honest. It took more energy than I had anticipated to make it work, but type inferences now behave when using `typeof .call` and `typeof .context` almost exactly as they do in Zod with `z.input<typeof validator>` and `z.infer<typeof validator>`/`z.output<typeof validator>`. This closes [Issue #5](https://github.com/TheAppleFreak/moleculer-zod-validator/issues/5).

  I do say almost, as there is an important note that is worth mentioning. [There's a known upstream bug in Zod where using `.catchall()` results in bugged TypeScript type inference](https://github.com/colinhacks/zod/issues/1949). While I could have left that behavior in ZodParams for parity with Zod, the sudden introduction of that behavior could break builds (it already broke one of our tests, through no fault of my own), so for the time being I've disabled catchall type inference in ZodParams. When the bug is fixed upstream, I'll reenable that behavior here. 

  Beyond all of this, there should be no other changes and everything should Just Work™ as expected.
* Updated dev dependencies

## 3.0.1 (2023/4/13)

* No changes were made; NPM just didn't get the memo that there was a README.

## 3.0.0 (2023/4/13)

* **BREAKING CHANGE** - The minimum compatible Node.js version is now Node.js v17.0.0. This is due to the requirement of the `structuredClone` function in the fastest-validator fallback (described below), which in Node.js is only available in v17.0.0 and above. I tried using Lodash's `cloneDeep` method like Moleculer itself uses, but for a reason unknown to me it kept causing crashes during unit testing that I couldn't figure out. `structuredClone` does work, however, which should solve the same problem. 
* Added support for passing in fastest-validator schemas. This is required because the `$node` internal services built into Moleculer assume that fastest-validator is the current validator, which poses a problem given as moleculer-zod-validator had no idea what to do with those schemas. By checking for the existence of property in the Zod schema that is not used in fastest-validator, this can now automatically switch into a failsafe that uses fastest-validator instead. 
* Added new unit tests for the FV fallback
* Added descriptive type comments to ZodParams
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