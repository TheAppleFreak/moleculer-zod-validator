import { z } from "zod";

import type { ZodOptional } from "zod";

/**
 * An adapter for a standard {@link https://github.com/colinhacks/zod#objects ZodObject},
 * which can be easier to work with in Moleculer than Zod on its own.
 */
export class ZodParams<Schema extends Parameters<(typeof z)["object"]>[0]> {
    private _rawSchema: Schema;
    private _rawSchemaWithOptions!: Schema & {
        $$$options: z.infer<typeof ZodParamsOptions>;
    };

    // This is an attempt to improve type inference
    public _mode: "strip" | "strict" | "passthrough";
    public _partial: boolean;

    public readonly _validator: z.ZodObject<
        Schema,
        this["_mode"]
    >;

    /**
     * Creates a new ZodParams adapter, which can be used to more easily provide typing information to Moleculer services and calls.
     * @param {ZodRawShape} schema - The schema used in {@link https://github.com/colinhacks/zod#objects z.object()}.
     * @param {ZodParamsOptionsType} options - This exposes several methods available on the ZodObject type,
     * {@link https://github.com/colinhacks/zod#table-of-contents which can be referenced under the Objects section in the Zod documentation}.
     */
    constructor(schema: Schema, options: ZodParamsOptionsType = {}) {
        this._rawSchema = schema;

        const opts = ZodParamsOptions.parse(options);

        // This is an effort to hopefully improve type inference
        this._partial = false;
        this._validator = z.object(this._rawSchema);

        if (opts.strip) {
            this._mode = "strip";
            this._validator = this._validator.strip();
        } else if (opts.strict) {
            this._mode = "strict";
            this._validator = this._validator.strict();
        } else if (opts.passthrough) {
            this._mode = "passthrough";
            this._validator = this._validator.passthrough();
        } else {
            this._mode = "strip";
        }

        // TODO: Figure out how to make Schema optional
        if (opts.partial) {
            this._partial = true;
            // this._validator = this._validator.partial();
        } 

        // So, there's a bug in my code where the types for all of these options
        // are generated regardless of the options chosen. I'm not sure how to address
        // this, unfortunately. TODO: Figure this out later
        // let validator;

        // if (opts.strip) {
        //     validator = z.object(this._rawSchema).strip();
        // } else if (opts.passthrough) {
        //     validator = z.object(this._rawSchema).passthrough();
        // } else if (opts.strict) {
        //     validator = z.object(this._rawSchema).strict();
        // } else {
        //     validator = z.object(this._rawSchema);
        // }

        // if (opts.partial) {
        //     validator = validator.partial();
        // }
        // if (opts.deepPartial) {
        //     validator = validator.deepPartial();
        // }
        // if (opts.catchall) {
        //     validator = validator.catchall(opts.catchall);
        // }

        this._rawSchemaWithOptions = Object.assign({}, schema, {
            $$$options: opts
        });
    }

    /**
     * Returns the raw Zod schema provided in the constructor. This should be passed
     * to the `params` object in the action definition.
     *
     * @example
     * broker.createService({
     *     name: "example",
     *     actions: {
     *         exampleAction: {
     *             params: zodParamObject.schema,
     *             handler(ctx: Context<typeof zodParamObject.context>) { ... }
     *         }
     *     }
     * });
     */
    get schema() {
        return this._rawSchemaWithOptions;
    }

    /**
     * Returns the compiled ZodObject validator.
     */
    get validator() {
        return this._validator;
    }

    /**
     * The inferred input type from the compiled validator. This should be used with
     * `broker.call` or `ctx.call` as the second type parameter to get proper types
     * for the action call.
     *
     * @example
     * broker.call<
     *     ReturnType,
     *     typeof zodParamObject.call
     * >({ ... })
     */
    // get call() {
    //     return this._validator._input;
    // }
    public readonly call!: z.input<(typeof this)["_validator"]>;

    /**
     * The inferred output type from the compiled validator. This should be used within
     * the `Context` object in the action definition to get the proper types after the
     * parameters have passed through validation (and possible transformations).
     *
     * @example
     * broker.createService({
     *     name: "example",
     *     actions: {
     *         exampleAction: {
     *             params: zodParamObject.schema,
     *             handler(ctx: Context<typeof zodParamObject.context>) { ... }
     *         }
     *     }
     * });
     */
    public readonly context!: z.output<(typeof this)["_validator"]>;
}

const ZodParamsOptions = z
    .object({
        partial: z.boolean().default(false),
        deepPartial: z.boolean().default(false),
        strict: z.boolean().default(false),
        catchall: z.any(),
        passthrough: z.boolean(),
        strip: z.boolean().default(false)
    })
    .partial();

export type ZodParamsOptionsType = z.input<typeof ZodParamsOptions>;
