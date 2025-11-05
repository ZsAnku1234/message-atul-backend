"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.send = void 0;
const message_service_1 = require("../services/message.service");
const send = async (req, res) => {
    const { conversationId, content, attachments } = req.body;
    const message = await (0, message_service_1.sendMessage)({
        conversationId,
        senderId: req.user.id,
        content,
        attachments
    });
    res.status(201).json({ message });
};
exports.send = send;
