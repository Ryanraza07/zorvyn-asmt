import express from "express";
import {
  deleteUser,
  getAllUsers,
  getCurrentUser,
  getSingleUser,
  loginUser,
  registerUser,
  updateUserRole,
  updateUserStatus,
} from "../controller/user.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";
import { USER_ROLES } from "../utils/constants.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", protect, getCurrentUser);

router.get("/", protect, authorizeRoles(USER_ROLES.ADMIN), getAllUsers);
router.get("/:id", protect, authorizeRoles(USER_ROLES.ADMIN), getSingleUser);
router.patch(
  "/:id/role",
  protect,
  authorizeRoles(USER_ROLES.ADMIN),
  updateUserRole,
);
router.patch(
  "/:id/status",
  protect,
  authorizeRoles(USER_ROLES.ADMIN),
  updateUserStatus,
);
router.delete("/:id", protect, authorizeRoles(USER_ROLES.ADMIN), deleteUser);

export default router;
