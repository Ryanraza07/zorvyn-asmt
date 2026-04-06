import express from "express";
import { getDashboardOverview } from "../controller/dashboard.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";
import { USER_ROLES } from "../utils/constants.js";

const router = express.Router();

router.get(
  "/summary",
  protect,
  authorizeRoles(USER_ROLES.ADMIN, USER_ROLES.ANALYST, USER_ROLES.VIEWER),
  getDashboardOverview,
);

export default router;
