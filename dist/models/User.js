"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
const mongoose_1 = require("mongoose");
const userSchema = new mongoose_1.Schema({
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    displayName: { type: String, required: true, trim: true },
    avatarUrl: { type: String },
    password: { type: String, required: true },
    statusMessage: { type: String }
}, {
    timestamps: true
});
exports.UserModel = (0, mongoose_1.model)("User", userSchema);
