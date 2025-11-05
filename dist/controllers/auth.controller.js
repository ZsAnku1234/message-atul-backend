"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.me = exports.login = exports.register = void 0;
const auth_service_1 = require("../services/auth.service");
const register = async (req, res) => {
    const { email, password, displayName, avatarUrl } = req.body;
    const result = await (0, auth_service_1.registerUser)({ email, password, displayName, avatarUrl });
    res.status(201).json(result);
};
exports.register = register;
const login = async (req, res) => {
    const { email, password } = req.body;
    const result = await (0, auth_service_1.loginUser)({ email, password });
    res.json(result);
};
exports.login = login;
const me = async (req, res) => {
    res.json({ user: req.user });
};
exports.me = me;
