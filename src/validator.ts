import { z } from "zod";
import { Errors, Validators } from "moleculer";

// Why does this work when an import doesn't???
const FastestValidator = require("fastest-validator");

import type { ZodParamsOptionsType } from "./params";

import { mutateObject } from "./helpers";
import { ZOD_PARAMS_OPTIONS, ZOD_PARAMS_CHECK } from "./symbols";

export class ZodValidator extends Validators.Base {
    public fvFallback;

    constructor() {
        super({});

        this.fvFallback = new FastestValidator();
    }

    convertSchemaToMoleculer(schema: any): Record<string, any> {
        return schema;
    }

    compile(schema: Record<string, any>) {
        // ZodParams.schema embeds a pre-compiled check function on the schema object
        // under a symbol key. Moleculer's parseServiceSchema does
        // _.cloneDeep(actionDef) before calling compile(), which destroys Zod schema
        // objects (strips non-enumerable _zod, loses prototype chain). Lodash
        // preserves symbol-keyed properties and copies function references without
        // deep-cloning, so the check function survives intact and we use it directly.
        const zodCheck = (schema as ZodSchemaWithOptions)[ZOD_PARAMS_CHECK];
        if (typeof zodCheck === "function") {
            return zodCheck;
        }
        // Fallback: fastest-validator schema (used by Moleculer internal services)
        return this.fvFallback.compile(structuredClone(schema));
    }

    validate(params: unknown, schemaWithOptions: ZodSchemaWithOptions): boolean {
        // Since we have to worry about the fastest-validator fallback, check the
        // schema type and go back to the fallback depending on that. Same check
        // as in compile().
        if (
            Object.keys(schemaWithOptions).filter((key) =>
                schemaWithOptions[key].hasOwnProperty("_zod")
            ).length > 0
        ) {
            try {
                const {
                    [ZOD_PARAMS_OPTIONS]: opts,
                    [ZOD_PARAMS_CHECK]: _check,
                    ...schema
                } = schemaWithOptions;

                let compiled;

                if (opts.strictObject) {
                    compiled = z.object(schema).strict();
                } else if (opts.looseObject) {
                    compiled = z.object(schema).passthrough();
                } else {
                    compiled = z.object(schema);
                }

                if (opts.partial) {
                    compiled = compiled.partial(
                        typeof opts.partial === "object"
                            ? (opts.partial as any)
                            : undefined
                    );
                }

                if (opts.required) {
                    compiled = compiled.required(
                        typeof opts.required === "object"
                            ? (opts.required as any)
                            : undefined
                    );
                }

                if (opts.catchall) {
                    compiled = compiled.catchall(opts.catchall);
                }

                // Functions should be considered truthy
                if (opts.superRefine) {
                    compiled = compiled.superRefine(opts.superRefine);
                }
                if (opts.refine) {
                    if (typeof opts.refine === "function") {
                        compiled = compiled.refine(opts.refine);
                    } else {
                        compiled = compiled.refine(
                            opts.refine.validator,
                            opts.refine.params
                        );
                    }
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
                        err.issues
                    );

                throw err;
            }
        } else {
            const res = this.fvFallback.validate(
                params,
                structuredClone(schemaWithOptions)
            );
            if (res !== true)
                throw new Errors.ValidationError(
                    "Parameters validation error!",
                    "VALIDATION_ERROR",
                    res
                );

            return true;
        }
    }
}

type ZodSchemaWithOptions = Parameters<(typeof z)["object"]>[0] & {
    [ZOD_PARAMS_OPTIONS]: ZodParamsOptionsType;
    [ZOD_PARAMS_CHECK]?: (params: unknown) => boolean;
};
