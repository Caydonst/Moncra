// src/routes/playerRoutes.ts

import { Router, type Response } from "express";
import { requireAuth, type AuthenticatedRequest } from "../middleware/requireAuth.js";

const router = Router();

router.get(
    "/",
    requireAuth,
    (req: AuthenticatedRequest, res: Response) => {
        res.json({
            message: "Authenticated",
            user: req.user,
        });
    }
);

export default router;