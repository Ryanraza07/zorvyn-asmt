import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import AppError from "../utils/appError.js";
import asyncHandler from "../utils/asyncHandler.js";

const getBearerToken = (authorizationHeader) => {
  if (!authorizationHeader) {
    throw new AppError("Authorization header is required", 401);
  }

  const [scheme, token] = authorizationHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    throw new AppError("Authorization header must be in Bearer <token> format", 401);
  }

  return token;
};

export const protect = asyncHandler(async (req, _res, next) => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new AppError("JWT_SECRET is not configured", 500);
  }

  const token = getBearerToken(req.headers.authorization);

  let decodedToken;

  try {
    decodedToken = jwt.verify(token, secret);
  } catch (_error) {
    throw new AppError("Invalid or expired token", 401);
  }

  const user = await User.findById(decodedToken.sub);

  if (!user) {
    throw new AppError("User account no longer exists", 401);
  }

  if (!user.isActive) {
    throw new AppError("User account is inactive", 403);
  }

  req.user = user;
  next();
});
