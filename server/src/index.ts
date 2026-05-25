import express from "express";
import cors from "cors";
import { Server } from "@colyseus/core";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { createServer } from "http";
import { HubRoom } from "./rooms/HubRoom.js";

const port = Number(process.env.PORT || 2567);

const app = express();

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
}));

app.use(express.json());

const httpServer = createServer(app);

const gameServer = new Server({
  transport: new WebSocketTransport({
    server: httpServer,
  }),
});

gameServer.define("hub_room", HubRoom);

await gameServer.listen(port);

console.log(`Game server running on ws://localhost:${port}`);