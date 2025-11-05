"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const zod_1 = require("zod");
const errorHandler = (err, _req, res, _next) => {
    if (err instanceof zod_1.ZodError) {
        res.status(422).json({
            message: "Validation failed",
            errors: err.flatten()
        });
        return;
    }
    const status = err.status ?? 500;
    const message = status === 500 ? "Internal server error" : err.message;
    if (status === 500) {
        console.error("Unhandled error:", err);
    }
    res.status(status).json({ message });
};
exports.errorHandler = errorHandler;
