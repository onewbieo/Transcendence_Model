import type { FastifyInstance } from "fastify";
import speakeasy from "speakeasy";
import qrcode from "qrcode";
import { prisma } from "../prisma";
import { createNotification } from "../services/notificationService";

type JwtPayload = {
  sub: number;
  email: string;
  role: "USER" | "ADMIN";
  mfa?: boolean;
  purpose?: "2fa";
};

export async function twoFactorRoutes(app: FastifyInstance) {
  // Start setup: returns QR + secret (do NOT log secret)
  app.post(
    "/auth/2fa/setup",
    { preHandler: (app as any).authenticate },
    async (req: any, reply) => {
      const payload = req.user as JwtPayload;

      const user = await prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user)
        return reply.code(404).send({ error: "user not found" });

      // create secret for authenticator apps
      const secret = speakeasy.generateSecret({
        name: `ft_transcendence (${user.email})`,
      });

      // store secret but do not enable yet
      await prisma.user.update({
        where: { id: user.id },
        data: {
          twoFactorSecret: secret.base32,
          twoFactorEnabled: false,
        },
      });

      const qrDataUrl = await qrcode.toDataURL(secret.otpauth_url!);
      
      // Send notification about settingup 2FA
      await createNotification(user.id, "Two-Factor Authentication has been successfully setup.");

      return reply.send({
        otpauthUrl: secret.otpauth_url,
        qrDataUrl,
      });
    }
  );

  // Enable 2FA: user confirms OTP from app
  app.post(
    "/auth/2fa/enable",
    { preHandler: (app as any).authenticate },
    async (req: any, reply) => {
      const payload = req.user as JwtPayload;
      const body = req.body as { code?: string };

      if (!body.code)
        return reply.code(400).send({ error: "code required" });

      const user = await prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user || !user.twoFactorSecret)
        return reply.code(400).send({ error: "2fa not initialized" });

      const ok = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: "base32",
        token: body.code,
        window: 1,
      });

      if (!ok)
        return reply.code(401).send({ error: "invalid code" });

      await prisma.user.update({
        where: { id: user.id },
        data: { twoFactorEnabled: true },
      });
      
      // Send notification about enabling 2FA
      await createNotification(user.id, "Two-Factor Authentication has been successfully enabled.");

      return reply.send({ ok: true });
    }
  );

  // Disable 2FA (require OTP)
  app.post(
    "/auth/2fa/disable",
    { preHandler: (app as any).authenticate },
    async (req: any, reply) => {
      const payload = req.user as JwtPayload;
      const body = req.body as { code?: string };

      if (!body.code)
        return reply.code(400).send({ error: "code required" });

      const user = await prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user || !user.twoFactorEnabled || !user.twoFactorSecret)
        return reply.code(400).send({ error: "2fa not enabled" });

      const ok = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: "base32",
        token: body.code,
        window: 1,
      });

      if (!ok)
        return reply.code(401).send({ error: "invalid code" });

      await prisma.user.update({
        where: { id: user.id },
        data: { twoFactorEnabled: false, twoFactorSecret: null },
      });
      
      // Send notification about disabled 2FA
      await createNotification(user.id, "Two-Factor Authentication has been successfully disabled.");

      return reply.send({ ok: true });
    }
  );

  // Verify OTP after login (exchange tempToken -> real token)
  app.post("/auth/2fa/verify", async (req: any, reply) => {
    const body = req.body as { tempToken?: string; code?: string };
    if (!body.tempToken || !body.code)
      return reply.code(400).send({ error: "tempToken and code required" });

    let tempPayload: JwtPayload;
    try {
      tempPayload = app.jwt.verify(body.tempToken) as any;
    }
    catch {
      return reply.code(401).send({ error: "invalid tempToken" });
    }

    if (tempPayload.purpose !== "2fa")
      return reply.code(401).send({ error: "invalid token purpose" });

    const user = await prisma.user.findUnique({ where: { id: tempPayload.sub } });
    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret)
      return reply.code(401).send({ error: "2fa not enabled" });

    const ok = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token: body.code,
      window: 1,
    });

    if (!ok)
      return reply.code(401).send({ error: "invalid code" });

    const token = app.jwt.sign(
      { sub: user.id, email: user.email, role: user.role, mfa: true } satisfies JwtPayload,
      { expiresIn: "7d" }
    );
    
    // Send notification about successful verification of 2FA
    await createNotification(user.id, "Two-Factor Authentication has been successfully verified.");

    return reply.send({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      token,
    });
  });
}

