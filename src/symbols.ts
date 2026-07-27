/**
 * Symbol keys used to smuggle the pre-compiled validator options/check function
 * through Moleculer's `_.cloneDeep(actionDef)` on service registration alongside
 * the raw Zod schema shape. Lodash's cloneDeep preserves symbol-keyed properties
 * (unlike non-enumerable ones), but symbol keys are invisible to `Object.keys`,
 * `for...in`, and `JSON.stringify` - so they don't leak into introspection tools
 * like `$node.actions`, unlike how plain string keys would.
 */
export const ZOD_PARAMS_OPTIONS = Symbol("ZodParams.options");
export const ZOD_PARAMS_CHECK = Symbol("ZodParams.check");
