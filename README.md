# moleculer-zod-validator

Validate Moleculer action parameters using the [Zod](https://github.com/colinhacks/zod) validator. 

![Continuous Integration](https://github.com/TheAppleFreak/moleculer-zod-validator/actions/workflows/tests.yml/badge.svg) [![npm version](https://badge.fury.io/js/moleculer-zod-validator.svg)](https://www.npmjs.com/package/moleculer-zod-validator) [![downloads](https://img.shields.io/npm/dw/moleculer-zod-validator)]((https://www.npmjs.com/package/moleculer-zod-validator))


## Supports

* Supports [Moleculer](https://moleculer.services) v0.14.x
* Supports [Zod](https://github.com/colinhacks/zod) v3.x.x

## Install

`npm install moleculer-zod-validator`

## Usage

### Broker

Import `ZodValidator`, then set up the validator in your broker settings using the `validator` property. For example:

```ts
// JavaScript
const { ServiceBroker } = require("moleculer");
const { ZodValidator } = require("moleculer-zod-validator");

// TypeScript
import { ServiceBroker } from "moleculer";
import { ZodValidator } from "moleculer-zod-validator";

const broker = new ServiceBroker({
    validator: new ZodValidator()
});
```

### Actions

One of Zod's main features is how it can infer TypeScript types from a schema. To simplify the usage of this, there is a convenience utility called `ZodParams` that allows for easy access to the necessary data.

The `ZodParams` constructor takes one to two arguments, `schema` and optionally `options`. 

* `schema` - This is a schema object that gets passed directly into `z.object`. [For all available schema options, please look at the Zod documentation.](https://github.com/colinhacks/zod#defining-schemas) Please note that transformation options (such as `default`) are currently unavailable in the main validator; please read the below note for more information.
* `options` - This provides access to some of the different functions available on a standard Zod object. All booleans default to `false`.
  * `partial` (boolean) - Shallowly makes all properties optional. ([docs](https://github.com/colinhacks/zod#partial))
  * `deepPartial` (boolean) - Deeply makes all properties optional. ([docs](https://github.com/colinhacks/zod#deepPartial))
  * `strict` (boolean) - Throws an error if unrecognized keys are present. ([docs](https://github.com/colinhacks/zod#strict))
  * `catchall` (Zod validator) - Validates all unknown keys against this schema. Obviates `strict`. ([docs](https://github.com/colinhacks/zod#catchall))
  * `compiledValidatorOnly` - This provides access to settings that transform the inputs that is currently not supported natively in the validator itself. Please read the note below for more information on this.
    * `passthrough` (boolean) - Passes through unrecognized keys. Equivalent to the current default behavior in this validator.
    * `strip` (boolean) - Removes unrecognized keys from the parsed input. Equivalent to Zod's default behavior.

**Important note**: As of this writing (v1.0.0), there is currently no support for transformation options (`strip`, `passthrough`, and `default` primarily), meaning that this validator only checks to see whether the shape of the incoming data is valid and then sends it to the action as received. I'm not sure how the default implementation of fastest-validator performs its transformations; this section will be updated if and when that support can be added. For transformation options in the interim, you can access the compiled validator within the action and run `ctx.params` through it again to properly transform the input. There will be a major version update (currently v2.0.0) once it is added.

Once constructed, there are four properties exposed on the `ZodParams` object.

* `schema` - The raw schema passed in. This should be passed to the `params` object in the action definition.
* `context` - The inferred output type from the compiled validator. This should be used within the `Context` object in Moleculer to get the proper types after the parameters have passed through validation. 
* `call` - The inferred input type from the compiled validator. This should be used with `broker.call` or `ctx.call` as the second type parameter to get proper types for the action call. 
* `validator` - The compiled validator. 

```ts
// It's easier to set up your validator objects outside of the service constructor so you can more easily access the typings later.
const simpleValidator = new ZodParams({
    string: z.string(),
    number: z.number(),
    optional: z.any().optional()
});

const complexValidator = new ZodParams({
    string: z.string(),
    number: z.number(),
    object: z.object({
        nestedString: z.string(),
        nestedBoolean: z.boolean()
    })
}, {
    partial: true,
    catchall: z.number()
}});

broker.createService({
    name: "example",
    actions: {
        simpleExample: {
            params: simpleValidator.schema, 
            handler(ctx: Context<typeof simpleValidator.context>) { ... }
        },
        complexExample: {
            params: complexValidator.schema,
            handler(ctx: Context<typeof complexExample.context>) { ... }
        }
    }
});

...

broker.call<returnType, typeof simpleValidator.call>({ string: "yes", number: 42 }); // calls successfully
broker.call<returnType, typeof complexValidator.call>({ object: { nestedString: "not optional", nestedBoolean: false }, unrecognizedKey: 69 }); // throws ValidationError
```
