import { z } from "zod";

import type {
    ZodArray,
    ZodNullable,
    ZodObject,
    ZodOptional,
    ZodRawShape,
    ZodTuple,
    ZodTupleItems,
    ZodTypeAny
} from "zod";

/**
 * An adapter for a standard {@link https://github.com/colinhacks/zod#objects ZodObject},
 * which can be easier to work with in Moleculer than Zod on its own.
 */
export class ZodParams<
    ZPSchema extends Parameters<(typeof z)["object"]>[0],
    ZPOptions extends ZodParamsOptionsType
> {
    private _rawSchema: ZPSchema;
    private _rawSchemaWithOptions!: ZPSchema & {
        $$$options: z.infer<typeof ZodParamsOptions>;
    };

    // These types are used purely to assist in type inference within this class
    /** This property is purely for type inference and should not be used. */
    public _mode!: ZPOptions["strip"] extends true
        ? "strip"
        : ZPOptions["strict"] extends true
        ? "strict"
        : ZPOptions["passthrough"] extends true
        ? "passthrough"
        : "strip";
    /** This property is purely for type inference and should not be used. */
    public _processedSchema!: ZPOptions["partial"] extends true
        ? ZodParamsMakeOptionalSchema<ZPSchema>
        : ZPOptions["deepPartial"] extends true
        ? {
              [K in keyof ZPSchema]: ZPSchema[K] extends ZodOptional<ZPSchema[K]>
                  ? ZodDeepPartial<ZPSchema[K]>
                  : ZodOptional<ZodDeepPartial<ZPSchema[K]>>;
          }
        : ZPSchema;

    /** This property is purely for type inference and should not be used. */
    public _catchall!: ZPOptions["catchall"] extends ZodTypeAny
        ? ZPOptions["catchall"]
        : ZodTypeAny;

    public readonly _validator: z.ZodObject<
        this["_processedSchema"],
        this["_mode"],
        this["_catchall"]
    >;

    /**
     * Creates a new ZodParams adapter, which can be used to more easily provide typing information to Moleculer services and calls.
     * @param {ZodRawShape} schema - The schema used in {@link https://github.com/colinhacks/zod#objects z.object()}.
     * @param {ZodParamsOptionsType} options - This exposes several methods available on the ZodObject type,
     * {@link https://github.com/colinhacks/zod#table-of-contents which can be referenced under the Objects section in the Zod documentation}.
     */
    constructor(schema: ZPSchema, options?: ZPOptions) {
        this._rawSchema = schema;

        const opts = ZodParamsOptions.parse(options || {});

        // This is an effort to hopefully improve type inference
        // As for the @ts-expect-errors ahead, while trying to get this code to work as
        // you'd expect, I had to use some of my own types that were supposed to be
        // interoperable with the original Zod types. While the interop is supposed to
        // be one-way, TypeScript is giving me errors assuming it's supposed to go both
        // ways. As much as I'd like to give TS as much power over things as I can,
        // here it's just wrong.
        // @ts-expect-error
        this._validator = z.object(this._rawSchema);

        if (opts.strip) {
            // @ts-expect-error
            this._validator = this._validator.strip();
        } else if (opts.strict) {
            // @ts-expect-error
            this._validator = this._validator.strict();
        } else if (opts.passthrough) {
            // @ts-expect-error
            this._validator = this._validator.passthrough();
        }

        if (opts.partial) {
            // @ts-expect-error
            this._validator = this._validator.partial();
        } else if (opts.deepPartial) {
            // @ts-expect-error
            this._validator = this._validator.deepPartial();
        }

        if (opts.catchall) {
            this._validator = this._validator.catchall(opts.catchall);
        }

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

export type ZodParamsOptionsType = {
    catchall?: ZodTypeAny;
} & Omit<z.input<typeof ZodParamsOptions>, "catchall">;

type ZodParamsMakeOptionalSchema<T extends Parameters<(typeof z)["object"]>[0]> = {
    [K in keyof T]: T[K] extends ZodOptional<T[K]> ? T[K] : ZodOptional<T[K]>;
};

// This is for implementing the deepPartial behavior in the types
// Originally from zod/src/helpers/partialUtil.ts
// https://github.com/colinhacks/zod/blob/4d016b772b79d566bfa2a0c2fc5bfbd92b776982/src/helpers/partialUtil.ts
type ZodDeepPartial<T extends ZodTypeAny> = T extends ZodObject<ZodRawShape>
    ? ZodObject<
          { [k in keyof T["shape"]]: ZodOptional<ZodDeepPartial<T["shape"][k]>> },
          T["_def"]["unknownKeys"],
          T["_def"]["catchall"]
      >
    : T extends ZodArray<infer Type, infer Card>
    ? ZodArray<ZodDeepPartial<Type>, Card>
    : T extends ZodOptional<infer Type>
    ? ZodOptional<ZodDeepPartial<Type>>
    : T extends ZodNullable<infer Type>
    ? ZodNullable<ZodDeepPartial<Type>>
    : T extends ZodTuple<infer Items>
    ? {
          [k in keyof Items]: Items[k] extends ZodTypeAny
              ? ZodDeepPartial<Items[k]>
              : never;
      } extends infer PI
        ? PI extends ZodTupleItems
            ? ZodTuple<PI>
            : never
        : never
    : T;
