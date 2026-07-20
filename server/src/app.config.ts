import "dotenv/config";
import express from "express";
import cors from "cors";
import {
    defineRoom,
    defineServer,
    matchMaker,
} from "colyseus";

import { HubRoom } from "./rooms/HubRoom.js";
import { DungeonRoom } from "./rooms/DungeonRoom.js";
import playerRoutes from "./routes/playerRoutes.js";

const defaultClientOrigins = [
    "http://localhost:3000",
    "https://moncra.vercel.app",
];

const configuredClientOrigins = process.env.CLIENT_URL
    ?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean) ?? [];

const allowedOrigins = [
    ...new Set([
        ...defaultClientOrigins,
        ...configuredClientOrigins,
    ]),
];

function isAllowedOrigin(
    origin: string | undefined
): boolean {
    return (
        origin === undefined ||
        allowedOrigins.includes(origin)
    );
}

matchMaker.controller.getCorsHeaders = (
    requestHeaders
) => {
    const origin = requestHeaders.get("origin");

    if (origin && allowedOrigins.includes(origin)) {
        return {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Headers":
                "Origin, X-Requested-With, Content-Type, Accept, Authorization",
            "Access-Control-Allow-Methods":
                "GET, POST, OPTIONS",
            Vary: "Origin",
        };
    }

    return {
        "Access-Control-Allow-Origin":
            allowedOrigins[0],
        "Access-Control-Allow-Credentials": "true",
        Vary: "Origin",
    };
};

const server = defineServer({
    rooms: {
        hub_room: defineRoom(HubRoom),
        dungeon_room: defineRoom(DungeonRoom),
    },

    express: (app) => {
        app.use(
            cors({
                origin(origin, callback) {
                    if (isAllowedOrigin(origin)) {
                        callback(null, true);
                        return;
                    }

                    callback(
                        new Error(
                            `CORS blocked origin: ${origin}`
                        )
                    );
                },
                credentials: true,
            })
        );

        app.use(express.json());

        app.use("/api/player", playerRoutes);

        app.get("/", (_req, res) => {
            res.json({
                status: "online",
                server: "Moncra",
            });
        });

        app.get("/health", (_req, res) => {
            res.json({
                status: "healthy",
            });
        });
    },

    beforeListen: () => {
        console.log(
            "MONCRA SERVER BUILD: cloud-config-2026-07-20"
        );

        console.log("Runtime environment:", {
            nodeEnv: process.env.NODE_ENV,
            port: process.env.PORT,
            region: process.env.REGION,
            country: process.env.COUNTRY,
            hasClientUrl: Boolean(
                process.env.CLIENT_URL
            ),
            hasSupabaseUrl: Boolean(
                process.env.SUPABASE_URL
            ),
            hasSupabasePublishableKey: Boolean(
                process.env
                    .SUPABASE_PUBLISHABLE_KEY
            ),
            hasSupabaseSecretKey: Boolean(
                process.env.SUPABASE_SECRET_KEY
            ),
        });

        console.log(
            "Allowed client origins:",
            allowedOrigins
        );
    },
});

export default server;