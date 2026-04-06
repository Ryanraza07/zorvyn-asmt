import asyncHandler from "../utils/asyncHandler.js";
import Transaction from "../models/transaction.model.js";
import { buildTransactionFilters } from "../utils/validation.js";

const createMonthKey = (year, month) => {
  return `${year}-${String(month).padStart(2, "0")}`;
};

const formatDashboardSummary = (rawSummary = {}) => {
  const totals = rawSummary.totals?.[0] || {
    totalIncome: 0,
    totalExpenses: 0,
    transactionCount: 0,
  };

  const categoryTotals = (rawSummary.categoryTotals || []).map((item) => ({
    category: item._id.category,
    type: item._id.type,
    totalAmount: item.totalAmount,
    count: item.count,
  }));

  const monthlyTrendMap = new Map();

  for (const item of rawSummary.monthlyTrends || []) {
    const period = createMonthKey(item._id.year, item._id.month);

    if (!monthlyTrendMap.has(period)) {
      monthlyTrendMap.set(period, {
        period,
        income: 0,
        expense: 0,
        net: 0,
      });
    }

    const currentMonth = monthlyTrendMap.get(period);
    currentMonth[item._id.type] = item.totalAmount;
    currentMonth.net = currentMonth.income - currentMonth.expense;
  }

  return {
    totalIncome: totals.totalIncome,
    totalExpenses: totals.totalExpenses,
    netBalance: totals.totalIncome - totals.totalExpenses,
    transactionCount: totals.transactionCount,
    categoryTotals,
    recentActivity: (rawSummary.recentActivity || []).map((item) => ({
      id: item._id.toString(),
      amount: item.amount,
      type: item.type,
      category: item.category,
      date: item.date,
      notes: item.notes,
    })),
    monthlyTrends: [...monthlyTrendMap.values()].sort((a, b) =>
      a.period.localeCompare(b.period),
    ),
  };
};

export const getDashboardOverview = asyncHandler(async (req, res) => {
  const filter = buildTransactionFilters(req.query);
  const [result] = await Transaction.aggregate([
    { $match: filter },
    {
      $facet: {
        totals: [
          {
            $group: {
              _id: null,
              totalIncome: {
                $sum: {
                  $cond: [{ $eq: ["$type", "income"] }, "$amount", 0],
                },
              },
              totalExpenses: {
                $sum: {
                  $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0],
                },
              },
              transactionCount: { $sum: 1 },
            },
          },
        ],
        categoryTotals: [
          {
            $group: {
              _id: {
                category: "$category",
                type: "$type",
              },
              totalAmount: { $sum: "$amount" },
              count: { $sum: 1 },
            },
          },
          { $sort: { totalAmount: -1, "_id.category": 1 } },
        ],
        recentActivity: [
          { $sort: { date: -1, createdAt: -1 } },
          { $limit: 5 },
          {
            $project: {
              amount: 1,
              type: 1,
              category: 1,
              date: 1,
              notes: 1,
            },
          },
        ],
        monthlyTrends: [
          {
            $group: {
              _id: {
                year: { $year: "$date" },
                month: { $month: "$date" },
                type: "$type",
              },
              totalAmount: { $sum: "$amount" },
            },
          },
          { $sort: { "_id.year": 1, "_id.month": 1 } },
        ],
      },
    },
  ]);

  const summary = formatDashboardSummary(result || {});

  res.json({
    message: "Dashboard summary fetched successfully",
    summary,
  });
});
