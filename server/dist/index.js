import "dotenv/config";
import express from "express";
import cors from "cors";
import { Server } from "@colyseus/core";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { createServer } from "http";
import { HubRoom } from "./rooms/HubRoom.js";
import { DungeonRoom } from "./rooms/DungeonRoom.js";
import playerRoutes from "./routes/playerRoutes.js";
const port = Number(process.env.PORT || 2567);
const expressApp = express();
expressApp.use(cors({
    origin: "http://localhost:3000",
    credentials: true,
}));
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
const httpServer = createServer(expressApp);
const gameServer = new Server({
    transport: new WebSocketTransport({
        server: httpServer,
    }),
});
gameServer.define("hub_room", HubRoom);
gameServer.define("dungeon_room", DungeonRoom);
await gameServer.listen(port);
console.log(`Game server running on ws://localhost:${port}`);
//# sourceMappingURL=index.js.map