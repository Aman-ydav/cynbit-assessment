import type { RequestHandler } from "express";
import type { ZodType } from "zod";

/**
 * Validates `req.body` against a zod schema and replaces it with the parsed (typed, stripped)
 * value. Failures go to the shared error handler, which returns a 400 with field-level issues.
 * Because parsing yields plain strings/booleans only, operator objects like {"$gt": ""} can
 * never reach a Mongo query.
 */
export function validateBody(schema: ZodType): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) return next(result.error);
    req.body = result.data;
    next();
  };
}
