import { defineRoom, defineServer } from "colyseus";
import cors from "cors";
import { HubRoom } from "./rooms/HubRoom.js";
import { DungeonRoom } from "./rooms/DungeonRoom.js";
import { PartyRoom } from "./rooms/PartyRoom.js";
import playerRoutes from "./routes/playerRoutes.js";
export default defineServer({
    rooms: {
        hub_room: defineRoom(HubRoom),
        party_room: defineRoom(PartyRoom),
        dungeon_room: defineRoom(DungeonRoom),
    },
    express: (app) => {
        app.use(cors({
            origin: process.env.CLIENT_URL ?? "http://localhost:3000",
            credentials: true,
        }));
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
    beforeListen: async () => {
        console.log("Moncra server starting...");
    },
});
//# sourceMappingURL=app.config.js.map