import { ServiceBroker, Context, Errors } from "moleculer";
import { ZodParams, ZodValidator } from "../src";
import { z } from "zod";

let broker: ServiceBroker;

// Create validators
const oneParam = new ZodParams({
    stringProp: z.string()
});
const twoParams = new ZodParams({
    stringProp: z.string(),
    numberProp: z.number()
});
const optionalParam = new ZodParams({
    optionalStringProp: z.string().optional(),
    mandatoryStringProp: z.string()
});

const selectivePartialParams = new ZodParams(
    {
        stringProp: z.string(),
        numberProp: z.number(),
        booleanProp: z.boolean()
    },
    {
        partial: { stringProp: true }
    }
);

const selectiveRequiredParams = new ZodParams(
    {
        optionalStringProp: z.string().optional(),
        optionalNumberProp: z.number().optional(),
        mandatoryStringProp: z.string()
    },
    {
        required: { optionalStringProp: true }
    }
);

const requiredParams = new ZodParams(
    {
        optionalStringProp: z.string().optional(),
        mandatoryStringProp: z.string()
    },
    {
        required: true
    }
);

const partialParams = new ZodParams(
    {
        stringProp: z.string(),
        numberProp: z.number(),
        objectProp: z.object({
            nestedStringProp: z.string(),
            nestedNumber: z.number()
        })
    },
    {
        partial: true
    }
);
const strictParams = new ZodParams(
    {
        stringProp: z.string()
    },
    {
        strictObject: true
    }
);
const passthroughParams = new ZodParams(
    {
        stringProp: z.string()
    },
    {
        looseObject: true
    }
);

const catchallParams = new ZodParams(
    {
        stringProp: z.string()
    },
    {
        catchall: z.number()
    }
);

const refineParamsUsingFunction = new ZodParams(
    {
        stringPropLongerThan10Chars: z.string()
    },
    {
        refine: (val) => val.stringPropLongerThan10Chars.length > 10
    }
);

const refineParamsUsingObject = new ZodParams(
    {
        stringPropLongerThan10Chars: z.string()
    },
    {
        refine: {
            validator: (val) => val.stringPropLongerThan10Chars.length > 10
        }
    }
);

const refineParamsUsingObjectAndParams = new ZodParams(
    {
        stringPropLongerThan10Chars: z.string()
    },
    {
        refine: {
            validator: (val) => val.stringPropLongerThan10Chars.length > 10,
            params: {
                message: "String is less than 10 characters long"
            }
        }
    }
);

const refineParamsUsingObjectAndStringParams = new ZodParams(
    {
        stringPropLongerThan10Chars: z.string()
    },
    {
        refine: {
            validator: (val) => val.stringPropLongerThan10Chars.length > 10,
            params: "String is less than 10 characters long"
        }
    }
);

const superRefineParams = new ZodParams(
    {
        stringPropLongerThan10Chars: z.string()
    },
    {
        superRefine(arg, ctx) {
            if (arg.stringPropLongerThan10Chars.length < 10) {
                ctx.addIssue({
                    code: "too_small",
                    origin: "string",
                    minimum: 10,
                    inclusive: true,
                    exact: false,
                    message: "String is less than 10 characters long"
                });
            }
        }
    }
);

// https://github.com/TheAppleFreak/moleculer-zod-validator/issues/11
// Best to double check that coercion actually works instead of just assuming
// it does 🤷‍♀️
const coerceParams = new ZodParams({
    coercedNumberProp: z.coerce.number()
});

// Coercions that produce a non-plain object (Date, Map, Set, ...) were being
// mangled by mutateObject on the way back out - see helpers.ts's isEnumerable.
const coerceDateParams = new ZodParams({
    coercedDateProp: z.coerce.date()
});

// Regression check for a bug where a failed validation threw synchronously
// instead of rejecting a promise, breaking the bulkhead feature and 
// permanently consuming that bulkhead slot. 
const bulkheadParams = new ZodParams({
    stringProp: z.string()
});

beforeAll(() => {
    broker = new ServiceBroker({
        validator: new ZodValidator(),
        logger: {
            type: "Console",
            options: {
                level: "warn",
                moduleColors: true,
                formatter: "simple",
                autoPadding: true
            }
        }
    });

    broker.createService({
        name: "test",
        actions: {
            noParams: {
                async handler(ctx: Context<{}>) {
                    return;
                }
            },
            oneParam: {
                params: oneParam.schema,
                async handler(ctx: Context<typeof oneParam.context>) {
                    return ctx.params;
                }
            },
            twoParams: {
                params: twoParams.schema,
                async handler(ctx: Context<typeof twoParams.context>) {
                    return ctx.params;
                }
            },
            optionalParam: {
                params: optionalParam.schema,
                async handler(ctx: Context<typeof optionalParam.context>) {
                    return ctx.params;
                }
            },
            selectivePartialParams: {
                params: selectivePartialParams.schema,
                async handler(ctx: Context<typeof selectivePartialParams.context>) {
                    return ctx.params;
                }
            },
            selectiveRequiredParams: {
                params: selectiveRequiredParams.schema,
                async handler(ctx: Context<typeof selectiveRequiredParams.context>) {
                    return ctx.params;
                }
            },
            requiredParams: {
                params: requiredParams.schema,
                async handler(ctx: Context<typeof requiredParams.context>) {
                    return ctx.params;
                }
            },
            partialParams: {
                params: partialParams.schema,
                async handler(ctx: Context<typeof partialParams.context>) {
                    return ctx.params;
                }
            },
            strictParams: {
                params: strictParams.schema,
                async handler(ctx: Context<typeof strictParams.context>) {
                    return ctx.params;
                }
            },
            passthroughParams: {
                params: passthroughParams.schema,
                async handler(ctx: Context<typeof passthroughParams.context>) {
                    return ctx.params;
                }
            },
            catchallParams: {
                params: catchallParams.schema,
                async handler(ctx: Context<typeof catchallParams.context>) {
                    return ctx.params;
                }
            },
            refineParamsUsingFunction: {
                params: refineParamsUsingFunction.schema,
                async handler(ctx: Context<typeof refineParamsUsingFunction.context>) {
                    return ctx.params;
                }
            },
            refineParamsUsingObject: {
                params: refineParamsUsingObject.schema,
                async handler(ctx: Context<typeof refineParamsUsingObject.context>) {
                    return ctx.params;
                }
            },
            refineParamsUsingObjectAndParams: {
                params: refineParamsUsingObjectAndParams.schema,
                async handler(
                    ctx: Context<typeof refineParamsUsingObjectAndParams.context>
                ) {
                    return ctx.params;
                }
            },
            refineParamsUsingObjectAndStringParams: {
                params: refineParamsUsingObjectAndStringParams.schema,
                async handler(
                    ctx: Context<typeof refineParamsUsingObjectAndStringParams.context>
                ) {
                    return ctx.params;
                }
            },
            superRefineParams: {
                params: superRefineParams.schema,
                async handler(ctx: Context<typeof superRefineParams.context>) {
                    return ctx.params;
                }
            },
            coerceParams: {
                params: coerceParams.schema,
                async handler(ctx: Context<typeof coerceParams.context>) {
                    return ctx.params;
                }
            },
            coerceDateParams: {
                params: coerceDateParams.schema,
                async handler(ctx: Context<typeof coerceDateParams.context>) {
                    return ctx.params;
                }
            },
            bulkheadParams: {
                params: bulkheadParams.schema,
                bulkhead: {
                    enabled: true,
                    concurrency: 1
                },
                async handler(ctx: Context<typeof bulkheadParams.context>) {
                    return ctx.params;
                }
            }
        }
    });

    return broker.start();
});

describe("valid parameters", () => {
    test("no parameters", async () => {
        const data = await broker.call("test.noParams");

        expect(data).toBeUndefined();
    });

    test("one parameter", async () => {
        const data = await broker.call<typeof oneParam.context, typeof oneParam.call>(
            "test.oneParam",
            {
                stringProp: "yes"
            }
        );

        expect(data).toEqual({ stringProp: "yes" });
    });

    test("two parameters", async () => {
        const data = await broker.call<typeof twoParams.context, typeof twoParams.call>(
            "test.twoParams",
            {
                stringProp: "yes",
                numberProp: 42
            }
        );

        expect(data).toEqual({ stringProp: "yes", numberProp: 42 });
    });

    test("optional parameters (with only mandatory)", async () => {
        const data = await broker.call<
            typeof optionalParam.context,
            typeof optionalParam.call
        >("test.optionalParam", {
            mandatoryStringProp: "yes"
        });

        expect(data).toEqual({ mandatoryStringProp: "yes" });
    });

    test("optional parameters (with both)", async () => {
        const data = await broker.call<
            typeof optionalParam.context,
            typeof optionalParam.call
        >("test.optionalParam", {
            mandatoryStringProp: "yes",
            optionalStringProp: "also yes"
        });

        expect(data).toEqual({
            mandatoryStringProp: "yes",
            optionalStringProp: "also yes"
        });
    });
});

describe("required modifier", () => {
    test("required modifier (with all required properties)", async () => {
        const data = await broker.call<
            typeof requiredParams.context,
            typeof requiredParams.call
        >("test.requiredParams", {
            mandatoryStringProp: "yes",
            optionalStringProp: "also yes"
        });

        expect(data).toEqual({
            mandatoryStringProp: "yes",
            optionalStringProp: "also yes"
        });
    });

    test("required modifier (missing previously-optional property)", async () => {
        try {
            await broker.call<
                typeof requiredParams.context,
                typeof requiredParams.call
            >(
                "test.requiredParams",
                // @ts-expect-error - optionalStringProp is now required
                { mandatoryStringProp: "yes" }
            );
        } catch (err) {
            expect(err).toBeInstanceOf(Errors.ValidationError);
        }
    });
});

describe("selective modifiers", () => {
    test("selective partial (omitting the partial-ized property)", async () => {
        const data = await broker.call<
            typeof selectivePartialParams.context,
            typeof selectivePartialParams.call
        >("test.selectivePartialParams", { numberProp: 42, booleanProp: true });

        expect(data).toEqual({ numberProp: 42, booleanProp: true });
    });

    test("selective partial (still requires non-partial-ized properties)", async () => {
        try {
            await broker.call<
                typeof selectivePartialParams.context,
                typeof selectivePartialParams.call
                // @ts-expect-error - numberProp and booleanProp are still required
            >("test.selectivePartialParams", { stringProp: "yes" });
        } catch (err) {
            expect(err).toBeInstanceOf(Errors.ValidationError);
        }
    });

    test("selective required (requires the newly-required property)", async () => {
        try {
            await broker.call<
                typeof selectiveRequiredParams.context,
                typeof selectiveRequiredParams.call
                // @ts-expect-error - optionalStringProp is now required
            >("test.selectiveRequiredParams", { mandatoryStringProp: "yes" });
        } catch (err) {
            expect(err).toBeInstanceOf(Errors.ValidationError);
        }
    });

    test("selective required (still allows other optional properties to be absent)", async () => {
        const data = await broker.call<
            typeof selectiveRequiredParams.context,
            typeof selectiveRequiredParams.call
        >("test.selectiveRequiredParams", {
            optionalStringProp: "now required",
            mandatoryStringProp: "yes"
            // optionalNumberProp intentionally absent
        });

        expect(data).toEqual({
            optionalStringProp: "now required",
            mandatoryStringProp: "yes"
        });
    });
});

describe("modifiers", () => {
    test("partial modifier", async () => {
        const data = await broker.call<
            typeof partialParams.context,
            typeof partialParams.call
        >("test.partialParams", {});

        expect(data).toEqual({});
    });

    // This invokes an upstream bug with type inferences
    // https://github.com/colinhacks/zod/issues/1949
    // TODO: Remove @ts-expect-error once that's fixed
    test("catchall modifier (valid)", async () => {
        const data = await broker.call<
            typeof catchallParams.context,
            typeof catchallParams.call
        >("test.catchallParams", {
            stringProp: "yes",
            // @ts-expect-error
            unrecognizedNumberProp: 42
        });

        expect(data).toEqual({ stringProp: "yes", unrecognizedNumberProp: 42 });
    });

    test("catchall modifier (invalid)", async () => {
        try {
            await broker.call<typeof strictParams.context, typeof strictParams.call>(
                "test.strictParams",
                {
                    stringProp: "yes",
                    // @ts-expect-error
                    unrecognizedBooleanProp: false
                }
            );
        } catch (err) {
            expect(err).toBeInstanceOf(Errors.ValidationError);
        }
    });

    test("refine with function", async () => {
        const data = await broker.call<
            typeof refineParamsUsingFunction.context,
            typeof refineParamsUsingFunction.call
        >("test.refineParamsUsingFunction", {
            stringPropLongerThan10Chars: "1234567890 is 10 chars"
        });

        expect(data).toEqual({
            stringPropLongerThan10Chars: "1234567890 is 10 chars"
        });
    });

    test("refine with object", async () => {
        const data = await broker.call<
            typeof refineParamsUsingObject.context,
            typeof refineParamsUsingObject.call
        >("test.refineParamsUsingObject", {
            stringPropLongerThan10Chars: "1234567890 is 10 chars"
        });

        expect(data).toEqual({
            stringPropLongerThan10Chars: "1234567890 is 10 chars"
        });
    });

    test("refine with object and params", async () => {
        const data = await broker.call<
            typeof refineParamsUsingObjectAndParams.context,
            typeof refineParamsUsingObjectAndParams.call
        >("test.refineParamsUsingObjectAndParams", {
            stringPropLongerThan10Chars: "1234567890 is 10 chars"
        });

        expect(data).toEqual({
            stringPropLongerThan10Chars: "1234567890 is 10 chars"
        });
    });

    test("refine with object and string params", async () => {
        const data = await broker.call<
            typeof refineParamsUsingObjectAndStringParams.context,
            typeof refineParamsUsingObjectAndStringParams.call
        >("test.refineParamsUsingObjectAndStringParams", {
            stringPropLongerThan10Chars: "1234567890 is 10 chars"
        });

        expect(data).toEqual({
            stringPropLongerThan10Chars: "1234567890 is 10 chars"
        });
    });

    test("superRefine", async () => {
        const data = await broker.call<
            typeof superRefineParams.context,
            typeof superRefineParams.call
        >("test.superRefineParams", {
            stringPropLongerThan10Chars: "1234567890 is 10 chars"
        });

        expect(data).toEqual({
            stringPropLongerThan10Chars: "1234567890 is 10 chars"
        });
    });

    // I couldn't reproduce this issue myself, but it's worth testing for!
    // https://github.com/TheAppleFreak/moleculer-zod-validator/issues/11
    test("coerce modifier (string input)", async () => {
        const data = await broker.call<
            typeof coerceParams.context,
            typeof coerceParams.call
        >("test.coerceParams", {
            coercedNumberProp: "42"
        });

        expect(data).toEqual({ coercedNumberProp: 42 });
        expect(typeof data.coercedNumberProp).toBe("number");
    });

    test("coerce modifier (invalid input still rejected)", async () => {
        try {
            await broker.call<typeof coerceParams.context, typeof coerceParams.call>(
                "test.coerceParams",
                { coercedNumberProp: "not a number" }
            );

            throw new Error("Should not reach this point");
        } catch (err) {
            expect(err).toBeInstanceOf(Errors.ValidationError);
        }
    });

    test("coerce modifier (string input, non-plain object output)", async () => {
        const isoString = "2024-01-15T00:00:00.000Z";

        const data = await broker.call<
            typeof coerceDateParams.context,
            typeof coerceDateParams.call
        >("test.coerceDateParams", {
            coercedDateProp: isoString
        });

        expect(data.coercedDateProp).toBeInstanceOf(Date);
        expect((data.coercedDateProp as Date).toISOString()).toBe(isoString);
    });
});

describe("unrecognized parameters", () => {
    test("calling noParams", async () => {
        const data = await broker.call("test.noParams", {
            unrecognizedParam: null
        });

        expect(data).toBeUndefined();
    });

    test("calling oneParam with unrecognized parameters (equivalent to strip: true)", async () => {
        const data = await broker.call<typeof oneParam.context, typeof oneParam.call>(
            "test.oneParam",
            {
                stringProp: "yes",
                // @ts-expect-error
                unrecognizedParam: null
            }
        );

        expect(data).toEqual({ stringProp: "yes" });
    });

    test("calling passthroughParams with unrecognized parameters", async () => {
        const data = await broker.call<
            typeof passthroughParams.context,
            typeof passthroughParams.call
        >("test.passthroughParams", {
            stringProp: "yes",
            // @ts-ignore
            unrecognizedParam: null
        });

        expect(data).toEqual({ stringProp: "yes", unrecognizedParam: null });
    });

    test("unrecognized parameters with strictObject: true", async () => {
        try {
            await broker.call<typeof strictParams.context, typeof strictParams.call>(
                "test.strictParams",
                {
                    stringProp: "yes",
                    // @ts-ignore
                    unrecognizedParam: null
                }
            );
        } catch (err) {
            expect(err).toBeInstanceOf(Errors.ValidationError);
        }
    });

    test("calling refine with function with too small string", async () => {
        try {
            await broker.call<
                typeof refineParamsUsingFunction.context,
                typeof refineParamsUsingFunction.call
            >("test.refineParamsUsingFunction", {
                stringPropLongerThan10Chars: "2small4me"
            });
        } catch (err) {
            expect(err).toBeInstanceOf(Errors.ValidationError);
        }
    });

    test("calling refine with object with too small string", async () => {
        try {
            await broker.call<
                typeof refineParamsUsingObject.context,
                typeof refineParamsUsingObject.call
            >("test.refineParamsUsingObject", {
                stringPropLongerThan10Chars: "2small4me"
            });
        } catch (err) {
            expect(err).toBeInstanceOf(Errors.ValidationError);
        }
    });

    test("calling refine with object and params with too small string", async () => {
        try {
            await broker.call<
                typeof refineParamsUsingObjectAndParams.context,
                typeof refineParamsUsingObjectAndParams.call
            >("test.refineParamsUsingObjectAndParams", {
                stringPropLongerThan10Chars: "2small4me"
            });
        } catch (err) {
            expect(err).toBeInstanceOf(Errors.ValidationError);
        }
    });

    test("calling refine with object and string params with too small string", async () => {
        try {
            await broker.call<
                typeof refineParamsUsingObjectAndStringParams.context,
                typeof refineParamsUsingObjectAndStringParams.call
            >("test.refineParamsUsingObjectAndStringParams", {
                stringPropLongerThan10Chars: "2small4me"
            });
        } catch (err) {
            expect(err).toBeInstanceOf(Errors.ValidationError);
        }
    });

    test("calling superRefine with too small string", async () => {
        try {
            await broker.call<
                typeof superRefineParams.context,
                typeof superRefineParams.call
            >("test.superRefineParams", {
                stringPropLongerThan10Chars: "2small4me"
            });
        } catch (err) {
            expect(err).toBeInstanceOf(Errors.ValidationError);
        }
    });
});

describe("calling internal services", () => {
    test("calling $node.services (fastest-validator schema) doesn't crash everything", async () => {
        const res = await broker.call("$node.services");

        expect(res).toBeTruthy();
    });

    test("calling $node.actions (fastest-validator schema) doesn't crash everything", async () => {
        const res = await broker.call("$node.actions");

        expect(res).toBeTruthy();
    });

    test("$node.actions does not advertise internal ZodParams bookkeeping keys", async () => {
        const res = await broker.call<
            Array<{ name: string; action?: { params?: object } }>,
            { withEndpoints: boolean }
        >("$node.actions", { withEndpoints: false });

        const oneParamAction = res.find((action) => action.name === "test.oneParam");
        const params = oneParamAction?.action?.params;

        // Object.keys/JSON.stringify are what introspection tools (and network
        // transport) actually see. The internal options/check function are kept on
        // symbol keys specifically so they're invisible here while still surviving
        // Moleculer's cloneDeep - see src/symbols.ts.
        expect(Object.keys(params ?? {})).toEqual(["stringProp"]);
        expect(JSON.stringify(params)).not.toMatch(
            /\$\$\$options|\$\$zodCheck|ZOD_PARAMS_OPTIONS|ZOD_PARAMS_CHECK|ZodParams\.options|ZodParams\.check/
        );
    });
});

describe("bulkhead slot release on validation failure", () => {
    test("a failed validation doesn't permanently consume the bulkhead slot", async () => {
        // Previously the compiled check function threw synchronously on a failed
        // validation. Moleculer's bulkhead feature expected async throws and would
        // lock the slot permanently until the process restarted.
        await expect(
            broker.call("test.bulkheadParams", {})
        ).rejects.toBeInstanceOf(Errors.ValidationError);

        // With concurrency: 1, if the previous call had leaked its slot this call would
        // queue forever and time out instead of resolving.
        const res = await broker.call("test.bulkheadParams", { stringProp: "hello" });

        expect(res).toEqual({ stringProp: "hello" });
    }, 2000);
});
