"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.httpLogger = void 0;
const morgan_1 = __importDefault(require("morgan"));
const env_1 = require("../config/env");
const format = env_1.env.nodeEnv === "production" ? "combined" : "dev";
exports.httpLogger = (0, morgan_1.default)(format);
