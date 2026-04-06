import mongoose from "mongoose";
import AppError from "./appError.js";
import { TRANSACTION_TYPES, USER_ROLES } from "./constants.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

const toObject = (value) => {
  return value && typeof value === "object" ? value : {};
};

const ensureString = (value, fieldName, options = {}) => {
  const { minLength = 1, maxLength } = options;

  if (value === undefined || value === null) {
    throw new AppError(`${fieldName} is required`, 400);
  }

  if (typeof value !== "string") {
    throw new AppError(`${fieldName} must be a string`, 400);
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    throw new AppError(`${fieldName} is required`, 400);
  }

  if (trimmedValue.length < minLength) {
    throw new AppError(
      `${fieldName} must be at least ${minLength} characters long`,
      400,
    );
  }

  if (maxLength && trimmedValue.length > maxLength) {
    throw new AppError(
      `${fieldName} must be at most ${maxLength} characters long`,
      400,
    );
  }

  return trimmedValue;
};

const ensureBoolean = (value, fieldName) => {
  if (typeof value !== "boolean") {
    throw new AppError(`${fieldName} must be a boolean value`, 400);
  }

  return value;
};

const ensureNumber = (value, fieldName) => {
  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue)) {
    throw new AppError(`${fieldName} must be a valid number`, 400);
  }

  if (parsedValue < 0) {
    throw new AppError(`${fieldName} cannot be negative`, 400);
  }

  return parsedValue;
};

export const ensureObjectId = (value, fieldName = "Resource id") => {
  if (!mongoose.isValidObjectId(value)) {
    throw new AppError(`${fieldName} is invalid`, 400);
  }

  return value;
};

export const parseDateInput = (value, fieldName) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new AppError(`${fieldName} must be a valid date`, 400);
  }

  return date;
};

export const parsePagination = (query = {}) => {
  const page = Number.parseInt(query.page ?? "1", 10);
  const limit = Number.parseInt(query.limit ?? "20", 10);

  if (!Number.isInteger(page) || page < 1) {
    throw new AppError("page must be a positive integer", 400);
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new AppError("limit must be an integer between 1 and 100", 400);
  }

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
};

export const validateRegistrationPayload = (payload = {}) => {
  const body = toObject(payload);
  const name = ensureString(body.name, "Name", { minLength: 2, maxLength: 80 });
  const email = ensureString(body.email, "Email").toLowerCase();
  const password = ensureString(body.password, "Password", { minLength: 6 });

  if (!EMAIL_REGEX.test(email)) {
    throw new AppError("Email must be a valid email address", 400);
  }

  return { name, email, password };
};

export const validateLoginPayload = (payload = {}) => {
  const body = toObject(payload);
  const email = ensureString(body.email, "Email").toLowerCase();
  const password = ensureString(body.password, "Password");

  if (!EMAIL_REGEX.test(email)) {
    throw new AppError("Email must be a valid email address", 400);
  }

  return { email, password };
};

export const validateRoleUpdatePayload = (payload = {}) => {
  const body = toObject(payload);
  const role = ensureString(body.role, "Role").toLowerCase();

  if (!Object.values(USER_ROLES).includes(role)) {
    throw new AppError(
      `Role must be one of: ${Object.values(USER_ROLES).join(", ")}`,
      400,
    );
  }

  return { role };
};

export const validateStatusUpdatePayload = (payload = {}) => {
  const body = toObject(payload);

  return {
    isActive: ensureBoolean(body.isActive, "isActive"),
  };
};

export const validateTransactionPayload = (payload = {}, options = {}) => {
  const body = toObject(payload);
  const partial = options.partial || false;
  const sanitizedPayload = {};

  if (!partial || hasOwn(body, "amount")) {
    sanitizedPayload.amount = ensureNumber(body.amount, "Amount");
  }

  if (!partial || hasOwn(body, "type")) {
    const type = ensureString(body.type, "Type").toLowerCase();

    if (!TRANSACTION_TYPES.includes(type)) {
      throw new AppError(
        `Type must be one of: ${TRANSACTION_TYPES.join(", ")}`,
        400,
      );
    }

    sanitizedPayload.type = type;
  }

  if (!partial || hasOwn(body, "category")) {
    sanitizedPayload.category = ensureString(body.category, "Category", {
      maxLength: 60,
    });
  }

  if (!partial || hasOwn(body, "date")) {
    sanitizedPayload.date = parseDateInput(body.date, "Date");
  }

  if (hasOwn(body, "notes")) {
    sanitizedPayload.notes =
      body.notes === null || body.notes === undefined || body.notes === ""
        ? ""
        : ensureString(body.notes, "Notes", { maxLength: 500 });
  } else if (!partial) {
    sanitizedPayload.notes = "";
  }

  if (partial && Object.keys(sanitizedPayload).length === 0) {
    throw new AppError("Provide at least one field to update", 400);
  }

  return sanitizedPayload;
};

const escapeRegExp = (value) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

export const buildTransactionFilters = (query = {}) => {
  const filter = {};

  if (query.type) {
    const type = ensureString(query.type, "type").toLowerCase();

    if (!TRANSACTION_TYPES.includes(type)) {
      throw new AppError(
        `type must be one of: ${TRANSACTION_TYPES.join(", ")}`,
        400,
      );
    }

    filter.type = type;
  }

  if (query.category) {
    const category = ensureString(query.category, "category", { maxLength: 60 });
    filter.category = new RegExp(`^${escapeRegExp(category)}$`, "i");
  }

  const startDate = query.startDate
    ? parseDateInput(query.startDate, "startDate")
    : null;
  const endDate = query.endDate ? parseDateInput(query.endDate, "endDate") : null;

  if (startDate && endDate && startDate > endDate) {
    throw new AppError("startDate cannot be after endDate", 400);
  }

  if (startDate || endDate) {
    filter.date = {};

    if (startDate) {
      filter.date.$gte = startDate;
    }

    if (endDate) {
      filter.date.$lte = endDate;
    }
  }

  if (query.search) {
    const search = ensureString(query.search, "search", { maxLength: 80 });
    const searchRegex = new RegExp(escapeRegExp(search), "i");
    filter.$or = [{ category: searchRegex }, { notes: searchRegex }];
  }

  return filter;
};

export const buildUserFilters = (query = {}) => {
  const filter = {};

  if (query.role) {
    const role = ensureString(query.role, "role").toLowerCase();

    if (!Object.values(USER_ROLES).includes(role)) {
      throw new AppError(
        `role must be one of: ${Object.values(USER_ROLES).join(", ")}`,
        400,
      );
    }

    filter.role = role;
  }

  if (query.status) {
    const status = ensureString(query.status, "status").toLowerCase();

    if (!["active", "inactive"].includes(status)) {
      throw new AppError("status must be either active or inactive", 400);
    }

    filter.isActive = status === "active";
  }

  if (query.search) {
    const search = ensureString(query.search, "search", { maxLength: 80 });
    const searchRegex = new RegExp(escapeRegExp(search), "i");
    filter.$or = [{ name: searchRegex }, { email: searchRegex }];
  }

  return filter;
};
