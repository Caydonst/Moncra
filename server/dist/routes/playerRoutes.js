// src/routes/playerRoutes.ts
import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
const router = Router();
router.get("/", requireAuth, (req, res) => {
    res.json({
        message: "Authenticated",
        user: req.user,
    });
});
export default router;
//# sourceMappingURL=playerRoutes.js.map