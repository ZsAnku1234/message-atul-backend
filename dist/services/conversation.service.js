"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRecentMessages = exports.getConversationById = exports.getConversationsForUser = exports.createDirectConversation = void 0;
const http_errors_1 = __importDefault(require("http-errors"));
const Conversation_1 = require("../models/Conversation");
const Message_1 = require("../models/Message");
const createDirectConversation = async (userId, participantIds) => {
    const participantSet = new Set([userId, ...participantIds]);
    if (!participantSet.has(userId)) {
        participantSet.add(userId);
    }
    const participants = Array.from(participantSet);
    if (participants.length < 2) {
        throw (0, http_errors_1.default)(400, "Conversation requires at least two participants");
    }
    const existing = await Conversation_1.ConversationModel.findOne({
        participants: { $size: participants.length, $all: participants }
    });
    if (existing) {
        return existing;
    }
    return Conversation_1.ConversationModel.create({
        participants,
        lastMessageAt: new Date()
    });
};
exports.createDirectConversation = createDirectConversation;
const getConversationsForUser = async (userId) => {
    const conversations = await Conversation_1.ConversationModel.find({ participants: userId })
        .populate("participants", "displayName email avatarUrl")
        .populate({
        path: "lastMessage",
        select: "content sender createdAt",
        populate: { path: "sender", select: "displayName avatarUrl" }
    })
        .sort({ updatedAt: -1 });
    return conversations;
};
exports.getConversationsForUser = getConversationsForUser;
const getConversationById = async (conversationId, userId) => {
    const conversation = await Conversation_1.ConversationModel.findById(conversationId)
        .populate("participants", "displayName email avatarUrl")
        .populate({
        path: "lastMessage",
        select: "content sender createdAt",
        populate: { path: "sender", select: "displayName avatarUrl" }
    });
    if (!conversation) {
        throw (0, http_errors_1.default)(404, "Conversation not found");
    }
    const hasAccess = conversation.participants.some((participant) => {
        if (typeof participant.equals === "function") {
            return participant.equals(userId);
        }
        return String(participant._id ?? "") === userId;
    });
    if (!hasAccess) {
        throw (0, http_errors_1.default)(403, "You do not have access to this conversation");
    }
    return conversation;
};
exports.getConversationById = getConversationById;
const getRecentMessages = async (conversationId, limit = 50) => {
    return Message_1.MessageModel.find({ conversation: conversationId })
        .populate("sender", "displayName avatarUrl")
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
};
exports.getRecentMessages = getRecentMessages;
