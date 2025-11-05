"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = void 0;
const validateRequest = (schema) => (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
        next(result.error);
        return;
    }
    req.body = result.data;
    next();
};
exports.validateRequest = validateRequest;
