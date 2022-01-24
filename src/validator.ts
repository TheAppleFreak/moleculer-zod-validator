import { z } from "zod";
import { Errors, Validators } from "moleculer";

import type { ZodParamsOptionsType } from "./params";

import { mutateObject } from "./helpers";

export class ZodValidator extends Validators.Base {
    constructor() {
        super();
    }

    compile(schema: ZodSchemaWithOptions) {
        return (params: unknown) => this.validate(params, schema);
    }

    validate(
        params: unknown,
        schemaWithOptions: ZodSchemaWithOptions,
    ): boolean {
        try {
            const { $$$options: opts, ...schema } = schemaWithOptions;

            let compiled;

            if (opts.strip) {
                compiled = z.object(schema).strip();
            } else if (opts.strict) {
                compiled = z.object(schema).strict();
            } else if (opts.passthrough) {
                compiled = z.object(schema).passthrough();
            } else {
                compiled = z.object(schema).strip();
            }
            if (opts.partial) {
                compiled = compiled.partial();
            }
            if (opts.deepPartial) {
                compiled = compiled.deepPartial();
            }
            if (opts.catchall) {
                compiled = compiled.catchall(opts.catchall);
            }

            const results = compiled.parse(params);

            // params is passed by reference, meaning that we can apply transformations
            // to what gets passed to the validator from here. However, simply setting
            // it to a new value will just change the pointer to the object in function
            // scope, so we need to actually mutate the original ourselves.
            mutateObject(params, results, false);

            return true;
        } catch (err) {
            if (err instanceof z.ZodError)
                throw new Errors.ValidationError(
                    "Parameter validation error",
                    "VALIDATION_ERROR",
                    err.issues,
                );

            throw err;
        }
    }
}

type ZodSchemaWithOptions = z.ZodRawShape & {
    $$$options: ZodParamsOptionsType;
};
