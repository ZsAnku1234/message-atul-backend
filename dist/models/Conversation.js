"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationModel = void 0;
const mongoose_1 = require("mongoose");
const conversationSchema = new mongoose_1.Schema({
    participants: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true }],
    lastMessage: { type: mongoose_1.Schema.Types.ObjectId, ref: "Message" },
    lastMessageAt: { type: Date }
}, { timestamps: true });
conversationSchema.index({ participants: 1 });
exports.ConversationModel = (0, mongoose_1.model)("Conversation", conversationSchema);
