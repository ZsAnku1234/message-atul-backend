"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createConversationSchema = void 0;
const zod_1 = require("zod");
exports.createConversationSchema = zod_1.z.object({
    participantIds: zod_1.z.array(zod_1.z.string().min(1)).min(1)
});
