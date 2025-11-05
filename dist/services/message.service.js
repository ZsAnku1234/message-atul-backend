"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMessage = void 0;
const http_errors_1 = __importDefault(require("http-errors"));
const Conversation_1 = require("../models/Conversation");
const Message_1 = require("../models/Message");
const sendMessage = async (params) => {
    const conversation = await Conversation_1.ConversationModel.findById(params.conversationId);
    if (!conversation) {
        throw (0, http_errors_1.default)(404, "Conversation not found");
    }
    const isParticipant = conversation.participants.some((participant) => participant.equals(params.senderId));
    if (!isParticipant) {
        throw (0, http_errors_1.default)(403, "You are not part of this conversation");
    }
    const message = await Message_1.MessageModel.create({
        conversation: params.conversationId,
        sender: params.senderId,
        content: params.content,
        attachments: params.attachments ?? []
    });
    conversation.lastMessage = message._id;
    conversation.lastMessageAt = message.createdAt;
    await conversation.save();
    return message.populate("sender", "displayName avatarUrl");
};
exports.sendMessage = sendMessage;
