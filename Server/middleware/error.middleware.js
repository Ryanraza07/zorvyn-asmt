import AppError from "../utils/appError.js";

export const notFoundHandler = (req, _res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
};

export const errorHandler = (error, _req, res, _next) => {
  let statusCode = error.statusCode || 500;
  let message = error.message || "Internal server error";
  let details;

  if (error.name === "ValidationError") {
    statusCode = 400;
    message = "Validation failed";
    details = Object.values(error.errors).map((item) => item.message);
  }

  if (error.name === "CastError") {
    statusCode = 400;
    message = `Invalid value for ${error.path}`;
  }

  if (error.code === 11000) {
    statusCode = 409;
    message = `Duplicate value for ${Object.keys(error.keyPattern).join(", ")}`;
  }

  const response = { message };

  if (details) {
    response.details = details;
  }

  res.status(statusCode).json(response);
};
