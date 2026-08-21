# CHANGELOG

(all dates use the ISO-8601 format, which is YYYY/MM/DD)

## 4.0.2 (2026/8/20)

* Fixed a bug in `params.ts` where validation errors were thrown synchronously where Moleculer expected them to throw asynchronously. When used with the bulkhead feature, validation failures would never settle and the bulkhead slots would be permanently filled until the process restarted. That shouldn't happen anymore. 
* Added a regression test for that bug

## 4.0.1 (2026/8/5)

* Fixed a bug in `mutateObject` that would improperly replace complex objects (notably Dates, BigInts, and so on) with `{}` at runtime, as well as adding a regression test for it. This should hopefully fix [Issue #11](https://github.com/TheAppleFreak/moleculer-zod-validator/issues/11) for real this time. 
* Removed strict engine check in package.json, since the engine requirements are instead forced by Moleculer 0.15's package.json. No need to have two redundant checks in this case.
* Updated lockfile so NPM would stop yelling at me about a security vulnerability.

## 4.0.0 (2026/07/29)

It's been a while. With this update, the library is now compatible with Moleculer 0.15 and Zod 4, though there's a lot of breaking changes as a result of the larger changes in Zod. 

* **BREAKING CHANGE** - Moleculer 0.15.x and Zod 4.x.x are now required as peer dependencies, up from 0.14.x and 3.x.x respectively.
* **BREAKING CHANGE** - The minimum compatible Node.js version is now v22.0.0, matching Moleculer 0.15's requirements.
* **BREAKING CHANGE** - The following options have been removed or renamed, mirroring changes in Zod: 
  * `deepPartial` has been removed altogether, as there's no direct replacement in Zod 4.
  * `strip` has been removed, as this is Zod 4's default behavior.
  * `strict` has been renamed to `strictObject`, [matching Zod 4's `z.strictObject` property.](https://zod.dev/api?id=zstrictobject#zstrictobject)
  * `passthrough` has been renamed to `looseObject`, [matching Zod 4's `z.looseObject` property.](https://zod.dev/api?id=zlooseobject#zlooseobject)
* **BREAKING CHANGE** - The `ctx.addIssue()` format used in `superRefine` callbacks changed in Zod 4. [The `type` field has been replaced by `origin`.](https://zod.dev/api?id=superrefine#superrefine)
* Added the `required` option. This is the inverse of `partial` and removes any `.optional()` wrappers from properties. 
* `partial` and `required` now accept a mask object to selectively target specific properties rather than applying to all of them:

  ```ts
  // Make only `name` optional, leaving other properties required
  new ZodParams({ name: z.string(), age: z.number() }, { partial: { name: true } });

  // Make only `email` required, leaving other optional properties as-is
  new ZodParams({ email: z.string().optional(), bio: z.string().optional() }, { required: { email: true } });
  ```
* The internal "bookkeeping" objects for the validator, such as the options object, no longer show up in the parameter list when running actions like `$node.actions`. This closes [Issue #10](https://github.com/TheAppleFreak/moleculer-zod-validator/issues/10).
* Tests have been updated accordingly for all dependency upgrades. Also added a guard for [Issue #11](https://github.com/TheAppleFreak/moleculer-zod-validator/issues/11), which I couldn't reproduce but still wanted to test against in the worst case scenario.
* Updated Zod links in README.md to point to the Zod v4 docs site
* Updated dev dependencies
* Updated the year in the license

## 3.3.1 (2023/6/22)

* Minor documentation change to reflect that you can't use a `ReturnType` with classes, as you'd run into TS2052. Whoops.

## 3.3.0 (2023/6/22)

* Added the `.return` property to `ZodParams`. This is a utility to store return types that can be used for typing action calls elsewhere.

  Return values are provided by providing a type on a new third optional constructor parameter. It does not matter what is passed in, so long as it is given the desired return types using the `as` keyword. Once stored, these can be referred to in the same way that you would access `.call` and `.context`. 

  ```ts
  const sampleParam = new ZodParams({ property: z.string() }, undefined, {} as Promise<string>);

  ... 

  const returnedValue = broker.call<typeof sampleParam.return, typeof sampleParam.call>({ property: "whatever" });
  // type of returnedValue is Promise<string>
  ```
* Updated dev dependencies

## 3.2.0 (2023/5/2)

* Added support for the `.refine` and `.superRefine` methods. These add additional flexibility for validation. This closes [Issue #7](https://github.com/TheAppleFreak/moleculer-zod-validator/issues/7).
* Added new unit tests for both methods
* Updated Github Actions workflows to use checkout@v3 and setup-node@v3
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