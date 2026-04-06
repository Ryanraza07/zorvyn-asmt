import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import AppError from "../utils/appError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { USER_ROLES } from "../utils/constants.js";
import {
  buildUserFilters,
  ensureObjectId,
  parsePagination,
  validateLoginPayload,
  validateRegistrationPayload,
  validateRoleUpdatePayload,
  validateStatusUpdatePayload,
} from "../utils/validation.js";

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new AppError("JWT_SECRET is not configured", 500);
  }

  return secret;
};

const createToken = (user) => {
  return jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
    },
    getJwtSecret(),
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "1d",
    },
  );
};

const ensureAnotherActiveAdminExists = async (userIdToExclude) => {
  const adminCount = await User.countDocuments({
    role: USER_ROLES.ADMIN,
    isActive: true,
    _id: { $ne: userIdToExclude },
  });

  if (adminCount === 0) {
    throw new AppError("At least one active admin must remain in the system", 400);
  }
};

export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = validateRegistrationPayload(req.body);
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new AppError("A user with this email already exists", 409);
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const isFirstUser = (await User.countDocuments()) === 0;

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role: isFirstUser ? USER_ROLES.ADMIN : USER_ROLES.VIEWER,
  });

  res.status(201).json({
    message: "User registered successfully",
    user,
    token: createToken(user),
  });
});

export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = validateLoginPayload(req.body);
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  const passwordMatches = await bcrypt.compare(password, user.password);

  if (!passwordMatches) {
    throw new AppError("Invalid email or password", 401);
  }

  if (!user.isActive) {
    throw new AppError("User account is inactive", 403);
  }

  res.json({
    message: "Login successful",
    user,
    token: createToken(user),
  });
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  res.json({
    message: "Current user fetched successfully",
    user: req.user,
  });
});

export const getAllUsers = asyncHandler(async (req, res) => {
  const filter = buildUserFilters(req.query);
  const { page, limit, skip } = parsePagination(req.query);

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  res.json({
    message: "Users fetched successfully",
    data: users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  });
});

export const getSingleUser = asyncHandler(async (req, res) => {
  const userId = ensureObjectId(req.params.id, "User id");
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  res.json({
    message: "User fetched successfully",
    user,
  });
});

export const updateUserRole = asyncHandler(async (req, res) => {
  const userId = ensureObjectId(req.params.id, "User id");
  const { role } = validateRoleUpdatePayload(req.body);
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (req.user.id === user.id && role !== USER_ROLES.ADMIN) {
    throw new AppError("You cannot remove your own admin role", 400);
  }

  if (user.role === USER_ROLES.ADMIN && role !== USER_ROLES.ADMIN) {
    await ensureAnotherActiveAdminExists(user._id);
  }

  user.role = role;
  await user.save();

  res.json({
    message: "User role updated successfully",
    user,
  });
});

export const updateUserStatus = asyncHandler(async (req, res) => {
  const userId = ensureObjectId(req.params.id, "User id");
  const { isActive } = validateStatusUpdatePayload(req.body);
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (req.user.id === user.id && !isActive) {
    throw new AppError("You cannot deactivate your own account", 400);
  }

  if (user.role === USER_ROLES.ADMIN && !isActive) {
    await ensureAnotherActiveAdminExists(user._id);
  }

  user.isActive = isActive;
  await user.save();

  res.json({
    message: "User status updated successfully",
    user,
  });
});

export const deleteUser = asyncHandler(async (req, res) => {
  const userId = ensureObjectId(req.params.id, "User id");
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (req.user.id === user.id) {
    throw new AppError("You cannot delete your own account", 400);
  }

  if (user.role === USER_ROLES.ADMIN && user.isActive) {
    await ensureAnotherActiveAdminExists(user._id);
  }

  await user.deleteOne();

  res.json({
    message: "User deleted successfully",
  });
});
