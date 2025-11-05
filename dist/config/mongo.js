"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectMongo = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("./env");
const connectMongo = async () => {
    mongoose_1.default.set("strictQuery", true);
    try {
        const connection = await mongoose_1.default.connect(env_1.env.mongoUri, {
            autoIndex: env_1.env.nodeEnv !== "production"
        });
        return connection;
    }
    catch (error) {
        console.error("Mongo connection error", error);
        throw error;
    }
};
exports.connectMongo = connectMongo;
