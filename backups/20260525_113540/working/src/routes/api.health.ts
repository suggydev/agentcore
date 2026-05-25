/**
 * Health check endpoint for monitoring / Kubernetes probes.
 * Returns 200 if the service process is alive.
 */
import { createAPIFileRoute } from "@tanstack/react-start/api";

export const APIRoute = createAPIFileRoute("/api/health")({
  GET: async ({ request }) => {
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();

    return new Response(
      JSON.stringify({
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: Math.round(uptime),
        version: process.env.APP_VERSION || "0.1.0",
        memory: {
          rss: Math.round(memoryUsage.rss / 1024 / 1024) + "MB",
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + "MB",
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  },
});
