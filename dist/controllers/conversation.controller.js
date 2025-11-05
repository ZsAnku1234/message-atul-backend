"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getById = exports.list = exports.create = void 0;
const conversation_service_1 = require("../services/conversation.service");
const create = async (req, res) => {
    const participantIds = req.body.participantIds;
    const conversation = await (0, conversation_service_1.createDirectConversation)(req.user.id, participantIds);
    res.status(201).json({ conversation });
};
exports.create = create;
const list = async (req, res) => {
    const conversations = await (0, conversation_service_1.getConversationsForUser)(req.user.id);
    res.json({ conversations });
};
exports.list = list;
const getById = async (req, res) => {
    const { id } = req.params;
    const conversation = await (0, conversation_service_1.getConversationById)(id, req.user.id);
    const messages = await (0, conversation_service_1.getRecentMessages)(id);
    res.json({ conversation, messages });
};
exports.getById = getById;
