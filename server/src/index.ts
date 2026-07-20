import "dotenv/config";
import express from "express";
import cors from "cors";
import { matchMaker, Server } from "@colyseus/core";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { createServer } from "http";

import { HubRoom } from "./rooms/HubRoom.js";
import { DungeonRoom } from "./rooms/DungeonRoom.js";
import playerRoutes from "./routes/playerRoutes.js";

const port = Number(process.env.PORT || 2567);

console.log("MONCRA SERVER BUILD: cors-fix-2026-07-20");
console.log("CLIENT_URL:", JSON.stringify(process.env.CLIENT_URL));

const allowedOrigins = [
  "http://localhost:3000",
  process.env.CLIENT_URL,
].filter((origin): origin is string => Boolean(origin));

const isAllowedOrigin = (origin: string | undefined): boolean => {
  return !origin || allowedOrigins.includes(origin);
};

const expressApp = express();

expressApp.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://moncra.vercel.app",
    ],
    credentials: true,
  })
);

/*
expressApp.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true,
  })
);
*/

expressApp.use(express.json());

expressApp.use("/api/player", playerRoutes);

expressApp.get("/", (_req, res) => {
  res.json({
    status: "online",
    server: "Moncra",
  });
});

expressApp.get("/health", (_req, res) => {
  res.json({
    status: "healthy",
  });
});

/**
 * Colyseus matchmaking routes do not use the Express CORS middleware.
 * Configure their CORS headers separately.
 */
matchMaker.controller.getCorsHeaders = () => {
  return {
    "Access-Control-Allow-Origin": "https://moncra.vercel.app",
    "Access-Control-Allow-Credentials": "true",
    "Vary": "Origin",
  };
};

const httpServer = createServer(expressApp);

const gameServer = new Server({
  transport: new WebSocketTransport({
    server: httpServer,
  }),
});

gameServer.define("hub_room", HubRoom);
gameServer.define("dungeon_room", DungeonRoom);

await gameServer.listen(port);

console.log(`Game server running on port ${port}`);
console.log("Allowed client origins:", allowedOrigins);