import { ZodType, z } from "zod";
import { Errors } from "moleculer";
import { mutateObject } from "./helpers";
import { ZOD_PARAMS_OPTIONS, ZOD_PARAMS_CHECK } from "./symbols";

import type {
    ZodArray,
    ZodNullable,
    ZodObject,
    ZodOptional,
    ZodRawShape,
    ZodTuple
} from "zod";

/**
 * An adapter for a standard {@link https://zod.dev/api#objects ZodObject},
 * which can be easier to work with in Moleculer than Zod on its own.
 */
export class ZodParams<
    ZPSchema extends ZodRawShape,
    ZPOptions extends ZodParamsOptionsType,
    ZPReturn = any
> {
    private _rawSchema: ZPSchema;
    private _rawSchemaWithOptions!: ZPSchema & {
        [ZOD_PARAMS_OPTIONS]: z.infer<typeof ZodParamsOptions>;
        [ZOD_PARAMS_CHECK]: (params: unknown) => boolean;
    };

    /** This property is purely for type inference and should not be used. */
    public _processedSchema!: ZPOptions["partial"] extends true
        ? ZodParamsMakeOptionalSchema<ZPSchema>
        : ZPOptions["partial"] extends Record<string, true>
          ? ZodParamsSelectiveOptionalSchema<ZPSchema, ZPOptions["partial"]>
          : ZPOptions["required"] extends true
            ? ZodParamsMakeRequiredSchema<ZPSchema>
            : ZPOptions["required"] extends Record<string, true>
              ? ZodParamsSelectiveRequiredSchema<ZPSchema, ZPOptions["required"]>
              : ZPSchema;

    // @ts-ignore - _processedSchema satisfies ZodRawShape by construction; TS can't prove this for conditional types
    public readonly _validator: z.ZodObject<this["_processedSchema"]>;

    /**
     * Creates a new ZodParams adapter, which can be used to more easily provide typing
     * information to Moleculer services and calls.
     * @param {ZodRawShape} schema - The schema used in
     * {@link https://zod.dev/api#objects z.object()}.
     * @param {ZodParamsOptionsType} options - This exposes several methods available
     * on the ZodObject type,
     * {@link https://zod.dev/api all of which can be referenced under the Objects section in the Zod documentation}.
     * @param {any} returnType - The return type of the action in question. This does
     * nothing at runtime and is used purely for storing a type on the object that can
     * then be referenced later on. This can be done like so:
     *
     * @example <caption>The return type will be `Promise<string>`</caption>
     * new ZodParams({ property: z.string() }, undefined, {} as Promise<string>)
     *
     * @todo
     * **Note**: {@link https://github.com/colinhacks/zod/issues/1949 There's currently a known issue in Zod where catchall type inferences don't work correctly.}
     * Until this upstream issue is fixed, catchall type inferences on ZodParams will
     * be disabled as not to break existing projects. This will not impact the runtime
     * behavior of catchall in the validator, just the type inference.
     *
     * If you wish to emulate the type inference, you can do so by using a TS union
     * when using broker.call or ctx.call.
     *
     * @example
     * broker.call<
     *     typeof zodParamObject.return,
     *     typeof zodParamObject.call & {[index: string]: string}
     * >({ ... })
     *
     */
    constructor(schema: ZPSchema, options?: ZPOptions, returnType?: ZPReturn) {
        this._rawSchema = schema;

        const opts = ZodParamsOptions.parse(options || {});

        // This is an effort to hopefully improve type inference
        // As for the @ts-expect-errors ahead, while trying to get this code to work as
        // you'd expect, I had to use some of my own types that were supposed to be
        // interoperable with the original Zod types. While the interop is supposed to
        // be one-way, TypeScript is giving me errors assuming it's supposed to go both
        // ways. As much as I'd like to give TS as much power over things as I can,
        // here it's just wrong.
        if (opts.strictObject) {
            // @ts-expect-error
            this._validator = z.object(this._rawSchema).strict();
        } else if (opts.looseObject) {
            // @ts-expect-error
            this._validator = z.object(this._rawSchema).passthrough();
        } else {
            // @ts-expect-error
            this._validator = z.object(this._rawSchema);
        }

        if (opts.partial) {
            // @ts-expect-error
            this._validator = this._validator.partial(
                typeof opts.partial === "object" ? (opts.partial as any) : undefined
            );
        }

        if (opts.required) {
            // @ts-expect-error
            this._validator = this._validator.required(
                typeof opts.required === "object" ? (opts.required as any) : undefined
            );
        }

        if (opts.catchall) {
            this._validator = this._validator.catchall(opts.catchall);
        }

        // Functions should be considered truthy
        if (opts.superRefine) {
            this._validator = this._validator.superRefine(opts.superRefine as any);
        }
        if (opts.refine) {
            if (typeof opts.refine === "function") {
                this._validator = this._validator.refine(opts.refine as any);
            } else {
                this._validator = this._validator.refine(
                    (opts.refine as any).validator,
                    (opts.refine as any).params
                );
            }
        }

        // Pre-compile the check function and store it as a plain function on the
        // schema object. Moleculer's parseServiceSchema does _.cloneDeep(actionDef)
        // which destroys Zod schema objects (strips non-enumerable _zod property,
        // loses prototype chain). Lodash copies function *references* without deep-
        // cloning them, so a function that closes over the ZodObject survives intact.
        // These are stashed under symbol keys rather than plain strings so that
        // they survive the same cloneDeep (lodash preserves symbol-keyed own
        // properties) without showing up as bogus params in introspection tools
        // like `$node.actions`, which only enumerate string keys.
        const validator = this._validator;
        const zodCheck = function (params: unknown): boolean {
            try {
                const results = validator.parse(params);
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
        };

        this._rawSchemaWithOptions = Object.assign({}, schema, {
            [ZOD_PARAMS_OPTIONS]: opts,
            [ZOD_PARAMS_CHECK]: zodCheck
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
     *     typeof zodParamObject.return,
     *     typeof zodParamObject.call
     * >({ ... })
     */
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

    /**
     * The output type provided at the time of instantiation. This should be used with
     * `broker.call` or `ctx.call` as the first type parameter to get proper types for
     * the action call.
     *
     * @example
     * broker.call<
     *     typeof zodParamObject.return,
     *     typeof zodParamObject.call
     * >({ ... })
     */
    public readonly return!: Promise<ZPReturn>;
}

const ZodParamsOptions = z
    .object({
        partial: z
            .union([z.boolean(), z.record(z.string(), z.literal(true))])
            .default(false),
        required: z
            .union([z.boolean(), z.record(z.string(), z.literal(true))])
            .default(false),
        strictObject: z.boolean().default(false),
        catchall: z.any(),
        looseObject: z.boolean(),
        refine: z.union([
            // Not sure how best to represent the validator function params
            z.function(),
            z.object({
                validator: z.function(),
                params: z.object({}).loose().optional()
            })
        ]),
        superRefine: z.function()
    })
    .partial();

type RefineValidator = (val: any) => unknown | Promise<unknown>;
type RefineParams =
    | string
    | {
          message?: string;
          path?: (string | number)[];
          params?: Record<string, unknown>;
      };

export type ZodParamsOptionsType = {
    catchall?: ZodType;
    refine?:
        | RefineValidator
        | {
              validator: RefineValidator;
              params?: RefineParams;
          };
    superRefine?: (arg: any, ctx: any) => void | Promise<void>;
} & Omit<z.input<typeof ZodParamsOptions>, "catchall" | "refine" | "superRefine">;

type ZodParamsMakeOptionalSchema<T extends ZodRawShape> = {
    [K in keyof T]: T[K] extends ZodOptional<T[K]> ? T[K] : ZodOptional<T[K]>;
};

type ZodParamsMakeRequiredSchema<T extends ZodRawShape> = {
    [K in keyof T]: T[K] extends ZodOptional<infer Inner> ? Inner : T[K];
};

type ZodParamsSelectiveOptionalSchema<
    T extends ZodRawShape,
    Mask extends Record<string, true>
> = {
    [K in keyof T]: K extends keyof Mask ? ZodOptional<T[K]> : T[K];
};

type ZodParamsSelectiveRequiredSchema<
    T extends ZodRawShape,
    Mask extends Record<string, true>
> = {
    [K in keyof T]: K extends keyof Mask
        ? T[K] extends ZodOptional<infer Inner>
            ? Inner
            : T[K]
        : T[K];
};
