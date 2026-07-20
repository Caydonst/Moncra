// src/middleware/requireAuth.ts
import { supabaseAuth } from "../lib/supabase.js";
export async function requireAuth(req, res, next) {
    const authorization = req.headers.authorization;
    if (!authorization?.startsWith("Bearer ")) {
        res.status(401).json({
            error: "Missing authorization token.",
        });
        return;
    }
    const accessToken = authorization.slice("Bearer ".length);
    const { data: { user }, error, } = await supabaseAuth.auth.getUser(accessToken);
    if (error || !user) {
        res.status(401).json({
            error: "Invalid or expired authorization token.",
        });
        return;
    }
    req.user = {
        id: user.id,
        email: user.email,
    };
    req.accessToken = accessToken;
    next();
}
//# sourceMappingURL=requireAuth.js.map