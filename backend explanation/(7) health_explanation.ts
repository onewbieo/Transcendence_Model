import type { FastifyInstance } from "fastify"; // ensure app has correct fastify methods //

export async function healthRoutes(app: FastifyInstance) { // receives the Fastify app //
							// registers healthRoutes endpoint //
	app.get("/health", async () => ({ ok: true })); // registers a GET /health //
}
