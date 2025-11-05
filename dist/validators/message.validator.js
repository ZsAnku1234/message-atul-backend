"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMessageSchema = void 0;
const zod_1 = require("zod");
exports.sendMessageSchema = zod_1.z.object({
    conversationId: zod_1.z.string().min(1),
    content: zod_1.z.string().min(1),
    attachments: zod_1.z.array(zod_1.z.string().url()).optional()
});
