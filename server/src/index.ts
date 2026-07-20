import server from "./app.config.js";

const port = Number(process.env.PORT ?? 2567);

try {
  await server.listen(port);
  console.log(`Game server running on port ${port}`);
} catch (error) {
  console.error("Failed to start Moncra server:", error);
  process.exit(1);
}