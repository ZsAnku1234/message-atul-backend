"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginUser = exports.registerUser = void 0;
const http_errors_1 = __importDefault(require("http-errors"));
const User_1 = require("../models/User");
const password_1 = require("../utils/password");
const jwt_1 = require("../utils/jwt");
const sanitizeUser = (user) => ({
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    statusMessage: user.statusMessage
});
const registerUser = async (params) => {
    const existing = await User_1.UserModel.findOne({ email: params.email });
    if (existing) {
        throw (0, http_errors_1.default)(409, "Email already registered");
    }
    const user = await User_1.UserModel.create({
        email: params.email,
        displayName: params.displayName,
        avatarUrl: params.avatarUrl,
        password: await (0, password_1.hashPassword)(params.password)
    });
    const token = (0, jwt_1.signAccessToken)(user.id);
    return { user: sanitizeUser(user), token };
};
exports.registerUser = registerUser;
const loginUser = async (params) => {
    const user = await User_1.UserModel.findOne({ email: params.email });
    if (!user) {
        throw (0, http_errors_1.default)(401, "Invalid credentials");
    }
    const valid = await (0, password_1.comparePassword)(params.password, user.password);
    if (!valid) {
        throw (0, http_errors_1.default)(401, "Invalid credentials");
    }
    const token = (0, jwt_1.signAccessToken)(user.id);
    return { user: sanitizeUser(user), token };
};
exports.loginUser = loginUser;
