import type { FastifyInstance } from "fastify";
import bcrypt from "bcrypt";
import { prisma } from "../prisma";
import { createNotification } from "../services/notificationService";
import { normalizeEmail, validateEmail, validatePassword } from "../utils/validate";

type JwtPayload = {
  sub: number;
  email: string;
  role: "USER" | "ADMIN";
  mfa?: boolean;
  purpose?: "2fa";
};

export async function authRoutes(app: FastifyInstance) {
  app.log.info("authRoutes registered");
  
  // POST /auth/signup // creates a user, issues a token after that //
  app.post("/auth/signup", async (req, reply) => {
    const body = req.body as { email?: string; password?: string; name?: string; role?: string };
    
    const email = normalizeEmail(body.email);
    const password = body.password ?? "";
    const role = body.role?.toUpperCase() === 'ADMIN' ? 'ADMIN' : 'USER';
    
    if (!email || !password)
    	return reply.code(400).send({ error: "email and password are required" });
    
    const emailErr = validateEmail(email);
    if (emailErr)
      return reply.code(400).send({ error: emailErr });
    
    const pwErr = validatePassword(password);
    if (pwErr)
      return reply.code(400).send({ error : pwErr });
    
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing)
    	return reply.code(409).send({ error: "email already exists" });
    
    const passwordHash = await bcrypt.hash(password, 10);
    
    const user = await prisma.user.create({
      data: { email, name: body.name ?? null, passwordHash, role },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });
    
    const token = app.jwt.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    } satisfies JwtPayload);
    
    console.log("Creating notification for user:", user.id);
    await createNotification(user.id, `Welcome ${user.email}, your account has been created.`);
    
    return reply.code(201).send({ user, token });
  }); 
  
  // POST /auth/login // compares and issues a new token //
  app.post("/auth/login", async (req, reply) => {
    const body = req.body as { email?: string; password?: string };
    
    const email = body.email?.trim().toLowerCase();
    const password = body.password;
    
    if (!email || !password)
    	return reply.code(400).send({ error: "email and password are required" });
    
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user)
      return reply.code(401).send({ error: "invalid credentials" });
    
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok)
      return reply.code(401).send({ error: "invalid credentials" });
    
    if (user.twoFactorEnabled) {
      const tempToken = app.jwt.sign(
        { sub: user.id, email: user.email, role: user.role, purpose: "2fa", mfa: false },
        { expiresIn: "5m" }
      );
    
      return reply.send({
        requires2fa: true,
        tempToken,
      });
    }
     
    const token = app.jwt.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    } satisfies JwtPayload);
    
    console.log("Creating notification for user:", user.id);
    // Send notification after login
    await createNotification(user.id, `Login successful.`);
    
    return reply.send({
      user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt },
      token,
    });
  });
  
  // GET /auth/me (protected) // who am i logged in right now ? //
  app.get("/auth/me", { preHandler: (app as any).authenticate }, async (req: any) => {
    const payload = req.user as JwtPayload;
    
    const me = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });
    
    return { me };
  });
}
