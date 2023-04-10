const Validator = require("fastest-validator");

const v = new Validator();

const schema = {
    id: { type: "number", positive: true, integer: true },
    name: { type: "string", min: 3, max: 255 },
    status: "boolean" // short-hand def
};

const check = v.compile(schema);

console.log("First:", check({ id: 5, name: "John", status: true }));
// Returns: true

console.log("Second:", check({ id: 2, name: "Adam" }));