import bcrypt from "bcrypt";
import type { FastifyInstance } from "fastify";
import { prisma } from "../prisma";
import { createNotification } from "../services/notificationService"; 

type JwtPayload = {
  sub: number;
  email: string;
  role: "USER" | "ADMIN";
  mfa?: boolean;
  purpose?: "2fa";
};

const isHttps = (process.env.FRONTEND_URL ?? "").startsWith("https://");

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: isHttps,
  path: "/",
  maxAge: 10 * 60, // 10 mins
};

export async function googleOAuthRoutes(app: FastifyInstance) {
  const { Issuer, generators } = await import("openid-client");
  
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUrl = process.env.GOOGLE_REDIRECT_URL;
  const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:5173";

  if (!clientId || !clientSecret || !redirectUrl) {
    app.log.warn("Google OAuth env vars missing; routes may fail.");
  }

  // Discover Google OIDC config
  const googleIssuer = await Issuer.discover("https://accounts.google.com");
  const client = new googleIssuer.Client({
    client_id: clientId!,
    client_secret: clientSecret!,
    redirect_uris: [redirectUrl!],
    response_types: ["code"],
  });

  // 1) Start OAuth: redirect user to Google
  app.get("/auth/oauth/google", async (req, reply) => {
    const state = generators.state();
    const codeVerifier = generators.codeVerifier();
    const codeChallenge = generators.codeChallenge(codeVerifier);

    // Store PKCE verifier + state in signed cookies (httpOnly)
    reply.setCookie("g_state", state, { ...COOKIE_OPTS, signed: true });
    reply.setCookie("g_verifier", codeVerifier, { ...COOKIE_OPTS, signed: true });

    const authUrl = client.authorizationUrl({
      scope: "openid email profile",
      state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      prompt: "select_account",
    });

    return reply.redirect(authUrl);
  });

  // 2) Callback: Google returns code -> exchange -> get profile -> issue JWT -> redirect to frontend
  app.get("/auth/oauth/google/callback", async (req, reply) => {
    const q = req.query as { code?: string; state?: string; error?: string };
    if (q.error) {
      return reply.code(400).send({ error: `google oauth error: ${q.error}` });
    }
    if (!q.code || !q.state) {
      return reply.code(400).send({ error: "missing code/state" });
    }

    const stateCookie = req.unsignCookie((req.cookies as any)?.g_state ?? "").value;
    const verifierCookie = req.unsignCookie((req.cookies as any)?.g_verifier ?? "").value;

    if (!stateCookie || !verifierCookie) {
      return reply.code(400).send({ error: "oauth cookies missing/expired" });
    }
    if (q.state !== stateCookie) {
      return reply.code(400).send({ error: "invalid oauth state" });
    }

    // Clear cookies ASAP
    reply.clearCookie("g_state", { path: "/", secure: isHttps });
    reply.clearCookie("g_verifier", { path: "/", secure: isHttps });

    const params = client.callbackParams(req.raw);

    const tokenSet = await client.callback(redirectUrl!, params, {
      state: q.state,
      code_verifier: verifierCookie,
    });

    const claims = tokenSet.claims();
    const googleSub = claims.sub;
    const email = (claims.email as string | undefined)?.toLowerCase();
    const name = (claims.name as string | undefined) ?? null;

    if (!googleSub || !email) {
      return reply.code(400).send({ error: "google did not return sub/email" });
    }

    // Find by googleSub first, then by email
    let user = await prisma.user.findFirst({
      where: { OR: [{ googleSub }, { email }] },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        googleSub: true,
        twoFactorEnabled: true,
      },
    });

    if (!user) {
      // Create a user. passwordHash is required in your schema:
      // We set a random hash so local login can't be used unless you add a password setup flow.
      const randomPw = generators.codeVerifier(); // random string
      const passwordHash = await bcrypt.hash(randomPw, 10); // if you don't have bcrypt decorator, see note below

      user = await prisma.user.create({
        data: {
          email,
          name,
          passwordHash,
          googleSub,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          googleSub: true,
          twoFactorEnabled: true,
        },
      });
    }
    else {
      // Ensure googleSub is linked + optionally update name
      if (!user.googleSub) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleSub, name: user.name ?? name },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
            googleSub: true,
            twoFactorEnabled: true,
          },
        });
      }
    }
    
    // Notify user OAUTH happened
    await createNotification(user.id, "You have successfully logged in using Google!");
    
    // If 2FA enabled issue TempToken (same behavior as /auth/login)
    if (user.twoFactorEnabled) {
      const tempToken = app.jwt.sign(
        { sub: user.id, email: user.email, role: user.role, purpose: "2fa", mfa: false } satisfies JwtPayload,
      );
      
      return reply.redirect(
        `${frontendUrl}/oauth/callback?requires2fa=1&tempToken=${encodeURIComponent(tempToken)}`
      );
    }

    const jwt = app.jwt.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    } satisfies JwtPayload);

    // Redirect back to frontend with token
    return reply.redirect(`${frontendUrl}/oauth/callback?token=${encodeURIComponent(jwt)}`);
  });
}

