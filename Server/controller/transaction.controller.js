import Transaction from "../models/transaction.model.js";
import AppError from "../utils/appError.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  buildTransactionFilters,
  ensureObjectId,
  parsePagination,
  validateTransactionPayload,
} from "../utils/validation.js";

export const createTransaction = asyncHandler(async (req, res) => {
  const payload = validateTransactionPayload(req.body);
  const transaction = await Transaction.create({
    ...payload,
    createdBy: req.user._id,
  });

  await transaction.populate("createdBy", "name email role");

  res.status(201).json({
    message: "Transaction created successfully",
    transaction,
  });
});

export const getTransactions = asyncHandler(async (req, res) => {
  const filter = buildTransactionFilters(req.query);
  const { page, limit, skip } = parsePagination(req.query);

  const [transactions, total] = await Promise.all([
    Transaction.find(filter)
      .populate("createdBy", "name email role")
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Transaction.countDocuments(filter),
  ]);

  res.json({
    message: "Transactions fetched successfully",
    data: transactions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  });
});

export const getSingleTransaction = asyncHandler(async (req, res) => {
  const transactionId = ensureObjectId(req.params.id, "Transaction id");
  const transaction = await Transaction.findById(transactionId).populate(
    "createdBy",
    "name email role",
  );

  if (!transaction) {
    throw new AppError("Transaction not found", 404);
  }

  res.json({
    message: "Transaction fetched successfully",
    transaction,
  });
});

export const updateTransaction = asyncHandler(async (req, res) => {
  const transactionId = ensureObjectId(req.params.id, "Transaction id");
  const payload = validateTransactionPayload(req.body, { partial: true });

  const transaction = await Transaction.findByIdAndUpdate(transactionId, payload, {
    new: true,
    runValidators: true,
  }).populate("createdBy", "name email role");

  if (!transaction) {
    throw new AppError("Transaction not found", 404);
  }

  res.json({
    message: "Transaction updated successfully",
    transaction,
  });
});

export const deleteTransaction = asyncHandler(async (req, res) => {
  const transactionId = ensureObjectId(req.params.id, "Transaction id");
  const transaction = await Transaction.findById(transactionId);

  if (!transaction) {
    throw new AppError("Transaction not found", 404);
  }

  await transaction.deleteOne();

  res.json({
    message: "Transaction deleted successfully",
  });
});
