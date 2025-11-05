"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const http_errors_1 = __importDefault(require("http-errors"));
const jwt_1 = require("../utils/jwt");
const User_1 = require("../models/User");
const authenticate = async (req, _res, next) => {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
        next((0, http_errors_1.default)(401, "Missing authorization header"));
        return;
    }
    try {
        const token = header.replace("Bearer ", "");
        const payload = (0, jwt_1.verifyToken)(token);
        const user = await User_1.UserModel.findById(payload.sub);
        if (!user) {
            next((0, http_errors_1.default)(401, "User not found"));
            return;
        }
        req.user = {
            id: user.id,
            email: user.email,
            displayName: user.displayName
        };
        next();
    }
    catch {
        next((0, http_errors_1.default)(401, "Invalid token"));
    }
};
exports.authenticate = authenticate;
