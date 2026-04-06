import express from "express";
import {
  createTransaction,
  deleteTransaction,
  getSingleTransaction,
  getTransactions,
  updateTransaction,
} from "../controller/transaction.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";
import { USER_ROLES } from "../utils/constants.js";

const router = express.Router();

router.post("/", protect, authorizeRoles(USER_ROLES.ADMIN), createTransaction);
router.get(
  "/",
  protect,
  authorizeRoles(USER_ROLES.ADMIN, USER_ROLES.ANALYST),
  getTransactions,
);
router.get(
  "/:id",
  protect,
  authorizeRoles(USER_ROLES.ADMIN, USER_ROLES.ANALYST),
  getSingleTransaction,
);
router.patch("/:id", protect, authorizeRoles(USER_ROLES.ADMIN), updateTransaction);
router.delete("/:id", protect, authorizeRoles(USER_ROLES.ADMIN), deleteTransaction);

export default router;
