"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageModel = void 0;
const mongoose_1 = require("mongoose");
const messageSchema = new mongoose_1.Schema({
    conversation: { type: mongoose_1.Schema.Types.ObjectId, ref: "Conversation", required: true },
    sender: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
    attachments: [{ type: String }]
}, { timestamps: true });
messageSchema.index({ conversation: 1, createdAt: -1 });
exports.MessageModel = (0, mongoose_1.model)("Message", messageSchema);
