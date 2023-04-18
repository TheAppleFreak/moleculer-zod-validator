import { ZodParams } from "./src";
import { z } from "zod";

const params = {
    string: z.string().transform(val => val.length)
};

const test = new ZodParams(params, { partial: true });

let validator: typeof test.validator;
let call: typeof test.call;
let context: typeof test.context;

const ref = z.object(params).partial();

let refCall: z.input<typeof ref>;
let refContext: z.infer<typeof ref>;