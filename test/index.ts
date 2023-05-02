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
const deepPartialParams = new ZodParams(
    {
        stringProp: z.string(),
        numberProp: z.number(),
        objectProp: z.object({
            nestedStringProp: z.string(),
            nestedNumber: z.number()
        })
    },
    {
        deepPartial: true
    }
);
const strictParams = new ZodParams(
    {
        stringProp: z.string()
    },
    {
        strict: true
    }
);
const passthroughParams = new ZodParams(
    {
        stringProp: z.string()
    },
    {
        passthrough: true
    }
);
const stripParams = new ZodParams(
    {
        stringProp: z.string()
    },
    {
        passthrough: true,
        strip: true // should override passthrough
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

const superRefineParams = new ZodParams(
    {
        stringPropLongerThan10Chars: z.string()
    },
    {
        superRefine(arg, ctx) {
            if (arg.stringPropLongerThan10Chars.length < 10) {
                ctx.addIssue({
                    type: "string",
                    code: z.ZodIssueCode.too_small,
                    minimum: 10,
                    inclusive: true,
                    exact: false,
                    message: "String is less than 10 characters long"
                });
            }
        }
    }
);

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
            partialParams: {
                params: partialParams.schema,
                async handler(ctx: Context<typeof partialParams.context>) {
                    return ctx.params;
                }
            },
            deepPartialParams: {
                params: deepPartialParams.schema,
                async handler(ctx: Context<typeof deepPartialParams.context>) {
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
            stripParams: {
                params: stripParams.schema,
                async handler(ctx: Context<typeof stripParams.context>) {
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
            superRefineParams: {
                params: superRefineParams.schema,
                async handler(ctx: Context<typeof superRefineParams.context>) {
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

describe("modifiers", () => {
    test("partial modifier", async () => {
        const data = await broker.call<
            typeof partialParams.context,
            typeof partialParams.call
        >("test.partialParams", {});

        expect(data).toEqual({});
    });

    test("deep partial modifier", async () => {
        const data = await broker.call<
            typeof deepPartialParams.context,
            typeof deepPartialParams.call
        >("test.deepPartialParams", {
            objectProp: {
                nestedStringProp: "yes"
            }
        });

        expect(data).toEqual({ objectProp: { nestedStringProp: "yes" } });
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

    test("calling stripParams with unrecognized parameters", async () => {
        const data = await broker.call<
            typeof stripParams.context,
            typeof stripParams.call
        >("test.stripParams", {
            stringProp: "yes",
            // @ts-ignore
            unrecognizedParam: null
        });

        expect(data).toEqual({ stringProp: "yes" });
    });

    test("unrecognized parameters with strict: true", async () => {
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
});
