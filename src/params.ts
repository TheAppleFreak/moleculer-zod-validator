import { z } from "zod";

export class ZodParams<Schema extends Parameters<(typeof z)["object"]>[0]> {
    private _rawSchema: Schema;
    private _rawSchemaWithOptions!: Schema & {
        $$$options: z.infer<typeof ZodParamsOptions>;
    };
    public readonly _validator;

    constructor(schema: Schema, options?: z.infer<typeof ZodParamsOptions>) {
        this._rawSchema = schema;

        options = Object.assign(
            {},
            {
                partial: false,
                deepPartial: false,
                strict: false,
                catchall: undefined,
                strip: false,
                passthrough: false
            } as z.infer<typeof ZodParamsOptions>,
            options
        );

        const opts = ZodParamsOptions.parse(options);
        let validator;

        // So, there's a bug in my code where the types for all of these options
        // are generated regardless of the options chosen. I'm not sure how to address
        // this, unfortunately. TODO: Figure this out later
        if (opts.strip) {
            validator = z.object(this._rawSchema).strip();
        } else if (opts.passthrough) {
            validator = z.object(this._rawSchema).passthrough();
        } else if (opts.strict) {
            validator = z.object(this._rawSchema).strict();
        } else {
            validator = z.object(this._rawSchema);
        }

        if (opts.partial) {
            validator = validator.partial();
        }
        if (opts.deepPartial) {
            validator = validator.deepPartial();
        }
        if (opts.catchall) {
            validator = validator.catchall(opts.catchall);
        }

        this._validator = validator;

        this._rawSchemaWithOptions = Object.assign({}, schema, {
            $$$options: opts
        });
    }

    get schema() {
        return this._rawSchemaWithOptions;
    }

    get validator() {
        return this._validator;
    }

    get call() {
        return this._validator._input;
    }

    get context() {
        return this._validator._output;
    }
}

const ZodParamsOptions = z
    .object({
        partial: z.boolean(),
        deepPartial: z.boolean(),
        strict: z.boolean(),
        catchall: z.any(),
        passthrough: z.boolean(),
        strip: z.boolean()
    })
    .deepPartial();

export type ZodParamsOptionsType = z.infer<typeof ZodParamsOptions>;
