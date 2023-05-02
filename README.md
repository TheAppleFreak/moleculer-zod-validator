# moleculer-zod-validator

Validate Moleculer action parameters using the [Zod](https://github.com/colinhacks/zod) validator. 

![Continuous Integration](https://github.com/TheAppleFreak/moleculer-zod-validator/actions/workflows/tests.yml/badge.svg) [![npm version](https://badge.fury.io/js/moleculer-zod-validator.svg)](https://www.npmjs.com/package/moleculer-zod-validator) [![downloads](https://img.shields.io/npm/dw/moleculer-zod-validator)]((https://www.npmjs.com/package/moleculer-zod-validator))

## Supports

* Supports [Moleculer](https://moleculer.services) v0.14.x
* Supports [Zod](https://github.com/colinhacks/zod) v3.x.x

## Requires

As of v3.0.0, this package requires Node.js v17.0.0 or above.

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

As of v3.0.0, moleculer-zod-validator implements the default Moleculer validator (fastest-validator) as a compatibility fallback for fastest-validator schemas, [like those used in Moleculer's internal services](https://github.com/moleculerjs/moleculer/issues/1094), so calling services using that should not be a problem. 

### Actions

One of Zod's main features is how it can infer TypeScript types from a schema. To simplify the usage of this, there is a convenience utility called `ZodParams` that allows for easy access to the necessary data.

The `ZodParams` constructor takes one or two arguments, `schema` and optionally `options`. 

* `schema` - This is a schema object that gets passed directly into `z.object`. [For all available schema options, please look at the Zod documentation.](https://github.com/colinhacks/zod#defining-schemas)
* `options` - This provides access to some of the different functions available on a standard Zod object. All booleans default to `false` except for `strip`, which is implicitly set to `true`.
  * `partial` (boolean) - Shallowly makes all properties optional. ([docs](https://github.com/colinhacks/zod#partial))
  * `deepPartial` (boolean) - Deeply makes all properties optional. ([docs](https://github.com/colinhacks/zod#deepPartial))
  * `strip` (boolean) - Removes unrecognized keys from the parsed input. This is Zod's default behavior and this validator's default behavior. Mutually exclusive with `passthrough` and `strict`, and will override them if set. ([docs](https://github.com/colinhacks/zod#strip))
  * `passthrough` (boolean) - Passes through unrecognized keys. Mutually exclusive with `strict` and `strip`. ([docs](https://github.com/colinhacks/zod#passthrough))
  * `strict` (boolean) - Throws an error if unrecognized keys are present. Mutually exclusive with `passthrough` and `strip`. ([docs](https://github.com/colinhacks/zod#strict))
  * `catchall` (Zod validator) - Validates all unknown keys against this schema. Obviates `strict`, `passthrough`, and `strip`. ([docs](https://github.com/colinhacks/zod#catchall))

    **NOTE**: [There is currently an upstream bug in Zod that prevents `catchall` type inference from working correctly.](https://github.com/colinhacks/zod/issues/1949) Type inference for catchall in ZodParams is disabled for the time being until that is fixed. If you wish to emulate the type inference, you can do so by using a type union when using `broker.call` or `ctx.call`. 

    ```ts
    broker.call<
        ReturnType,
        typeof zodParamObject.call & {[index: string]: string}
    >({ ... })
    ```
  * `refine` (function OR object) - Adds custom validation logic to the Zod object that can't be represented in TypeScript's type system or purely using Zod validators on their own (for example, making sure that at least one of several optional items are present). Returning any falsy value will fail validation, while returning any truthy value will pass validation. ([docs](https://github.com/colinhacks/zod/#refine))

    There are two ways to use this property. You can either pass in a validation function taking one parameter (representing the object being passed in) or an object with optionally two properties.

      * `validator` (function) - A validation function taking one parameter, representing the object being validated currently.
      * `params` (object, optional) - Additional properties to customize the error handling behavior, [as described in the Zod documentation](https://github.com/colinhacks/zod/#arguments)
    
    If both `refine` and `superRefine` are defined, `refine` will run last (after `superRefine`).

  * `superRefine` (function) - Adds custom validation logic to the Zod object that can't be represented in TypeScript's type system or purely using Zod validators on their own (for example, making sure that at least one of several optional items are present). This is a more powerful and verbose method of performing refinements. Validation will pass unless `ctx.addIssue` is called. ([docs](https://github.com/colinhacks/zod/#superrefine))

    This property takes a function with two arguments, `val` and `ctx` (not to be confused with Moleculer's `ctx` option).
    
      * `val` (object) - An object representing the object being validated currently. 
      * `ctx` (object) - An object provided by Zod. 
    
    If both `refine` and `superRefine` are defined, `superRefine` will run first (before `refine`).

Additionally, support for object transformations is present, allowing for the use of features such as [preprocessing](https://github.com/colinhacks/zod#preprocess), [refinements](https://github.com/colinhacks/zod#refine), [transforms](https://github.com/colinhacks/zod#transform), and [defaults](https://github.com/colinhacks/zod#default). 

Once constructed, there are four properties exposed on the `ZodParams` object.

* `schema` - The raw schema passed in. This should be passed to the `params` object in the action definition.
* `context` - The inferred output type from the compiled validator. This should be used within the `Context` object in the action definition to get the proper types after the parameters have passed through validation. 
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

// ...

broker.call<
    ReturnType, 
    typeof simpleValidator.call
>({ string: "yes", number: 42 }); // calls successfully

broker.call<
    ReturnType, 
    typeof complexValidator.call
>({
    object: { 
        nestedString: "not optional", 
        nestedBoolean: false 
    }, 
    unrecognizedKey: 69 
}); // throws ValidationError
```
