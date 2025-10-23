"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
var node_postgres_1 = require("drizzle-orm/node-postgres");
var schema = require("./schema");
var pg_1 = require("pg");
if (!process.env.POSTGRES_URL) {
    throw new Error("POSTGRES_URL is not defined");
}
var pool = new pg_1.Pool({
    connectionString: process.env.POSTGRES_URL,
});
exports.db = (0, node_postgres_1.drizzle)({
    client: pool,
    schema: schema,
    casing: "snake_case",
});
