import { escapeRegExp } from "../utils/regex";
import { UserModel } from "../models/User";

export const searchUsers = async (requesterId: string, query: string) => {
  const trimmed = query.trim();

  if (!trimmed) {
    return [];
  }

  const criteria = [];

  criteria.push({
    displayName: { $regex: escapeRegExp(trimmed), $options: "i" }
  });

  const digits = trimmed.replace(/\D/g, "");
  if (digits.length > 0) {
    criteria.push({
      phoneNumber: { $regex: digits, $options: "i" }
    });
  }

  if (criteria.length === 0) {
    return [];
  }

  const users = await UserModel.find({
    _id: { $ne: requesterId },
    $or: criteria
  })
    .limit(20)
    .select("_id displayName avatarUrl phoneNumber statusMessage")
    .lean();

  return users.map((user) => ({
    id: user._id.toString(),
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    phoneNumber: user.phoneNumber,
    statusMessage: user.statusMessage
  }));
};
