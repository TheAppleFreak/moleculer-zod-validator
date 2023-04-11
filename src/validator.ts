import { z } from "zod";
import { Errors, Validators } from "moleculer";
import _ from "lodash";

// Why does this work when an import doesn't???
const FastestValidator = require("fastest-validator");

import type { ZodParamsOptionsType } from "./params";

import { mutateObject } from "./helpers";

export class ZodValidator extends Validators.Base {
    public fvFallback;

    constructor() {
        super();

        this.fvFallback = new FastestValidator();
    }

    compile(schema: ZodSchemaWithOptions) {
        // There's an issue in Moleculer 0.14.x where the internal services like
        // $node.services use fastest-validator configuration and can't be changed.
        // Since the schema used for this validator is an object with all functions
        // (vs an object with strings/numbers/booleans) we can check for the existence
        // of the Zod _def property
        // Not super elegant, but hey, if it keeps Moleculer from crashing...
        // ¯\_(ツ)_/¯
        if (
            // _def exists on all ZodType objects and should be a good litmus test
            Object.keys(schema).filter((key) => schema[key].hasOwnProperty("_def"))
                .length > 0
        ) {
            return (params: unknown) => this.validate(params, schema);
        } else {
            // This is based on Moleculer's fastest.js validator
            // TODO: Why does this crash with cloneDeep?
            return this.fvFallback.compile(_.cloneDeep(schema));
        }
    }

    validate(params: unknown, schemaWithOptions: ZodSchemaWithOptions): boolean {
        // Since we have to worry about the fastest-validator fallback, check the
        // schema type and go back to the fallback depending on that. Same check
        // as in compile().
        if (
            Object.keys(schemaWithOptions).filter((key) =>
                schemaWithOptions[key].hasOwnProperty("_def")
            ).length > 0
        ) {
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
                        err.issues
                    );

                throw err;
            }
        } else {
            const res = this.fvFallback.validate(
                params,
                _.cloneDeep(schemaWithOptions)
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
    $$$options: ZodParamsOptionsType;
};
