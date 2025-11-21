import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

export const hashSecret = async (plain: string): Promise<string> => {
  return bcrypt.hash(plain, SALT_ROUNDS);
};

export const verifySecret = async (plain: string, hashed: string): Promise<boolean> => {
  return bcrypt.compare(plain, hashed);
};

// Backwards compatibility exports
export const hashPassword = hashSecret;
export const comparePassword = verifySecret;
