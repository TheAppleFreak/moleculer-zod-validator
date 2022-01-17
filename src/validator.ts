import { z } from "zod";
import { Errors, Validators } from "moleculer";

import type { ZodParamsOptionsType } from ".";

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

            // Uncomment when I figure out how to apply transformations from the validator
            /*
            if (opts.strip) {
                compiled = z.object(schema).strip();
            } else if (opts.strict) {
                compiled = z.object(schema).strict();
            } else if (opts.passthrough) {
                compiled = z.object(schema).passthrough();
            } else {
                compiled = z.object(schema);
            }
            */
            if (opts.strict) {
                compiled = z.object(schema).strict();
            } else {
                compiled = z.object(schema);
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

            compiled.parse(params);

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
