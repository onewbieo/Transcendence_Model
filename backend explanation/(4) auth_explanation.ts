import type { FastifyInstance } from "fastify"; // ensure app has correct fastify methods //
import bcrypt from "bcrypt"; // password security feature. Hashes passwords //
import { prisma } from "../prisma"; // Database access, used to create / find users // 

type JwtPayload = { // describes what is inside the JWT Token //
  sub: number; // subject = User ID //
  email: string; // email 
  role: "USER" | "ADMIN"; // authorization checks later //
};

export async function authRoutes(app: FastifyInstance) { // this function receives the Fastify app, //
							// registers the authentication routes onto it //
  app.log.info("authRoutes registered");
  
  // POST /auth/signup // creates a user, issues a token after that //
  app.post("/auth/signup", async (req, reply) => { // creating user plus token //
    const body = req.body as { email?: string; password?: string; name?: string }; // read request body as client sends e-mail, password and name //
    
    const email = body.email?.trim().toLowerCase(); // normalise input removes all the extra casing, spaces // 
    const password = body.password; // extract password //
    
    if (!email || !password)
    	return reply.code(400).send({ error: "email and password are required" }); // checks //
    if (password.length < 8)
    	return reply.code(400).send({ error: "password must be at least 8 characters" }); // checks on limits //
    
    const existing = await prisma.user.findUnique({ where: { email } }); // lookup the user by e-mail //
    if (existing)
    	return reply.code(409).send({ error: "email already exists" });
    
    const passwordHash = await bcrypt.hash(password, 10); // hashing of password //
    
    const user = await prisma.user.create({ // create user in Database, passwordHash is stored, not password //
      data: { email, name: body.name ?? null, passwordHash },
      select: { id: true, email: true, name: true, role: true, createdAt: true }, // select ensures passwordHash never leaves server //
    });
    
    const token = app.jwt.sign({ // JWT contains userId, e-mail, role // 
    sub: user.id,
    email: user.email,
    role: user.role,
    } satisfies JwtPayload); // Typescript check to ensure object matches JwtPayload shape, without forcing casting //
    
    return reply.code(201).send({ user, token }); // send response (user info, token for future requests) //
  }); 
  
  // POST /auth/login // compares and issues a new token //
  app.post("/auth/login", async (req, reply) => { // verifying identity // 
    const body = req.body as { email?: string; password?: string }; // read e-mail and password //
    
    const email = body.email?.trim().toLowerCase(); // normalise input //
    const password = body.password; // extract password // 
    
    if (!email || !password)
    	return reply.code(400).send({ error: "email and password are required" }); // checks //
    
    const user = await prisma.user.findUnique({ where: { email } }); // lookup the user by e-mail // 
    if (!user)
      return reply.code(401).send({ error: "invalid credentials" }); // if cannot find, error out //
    
    const ok = await bcrypt.compare(password, user.passwordHash); // compare the password with the stored hash //
    								// only bcrypt can verify correctness //
    if (!ok)
      return reply.code(401).send({ error: "invalid credentials" }); // Error msg if not matching //
      
    const token = app.jwt.sign({ // JWT contains userId, e-mail, role //
    sub: user.id,
    email: user.email,
    role: user.role,
    } satisfies JwtPayload); // Typescript check to ensure object matches JwtPayload shape, without forcing casting //
    
    return reply.send({
      user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt },
      token,
    });
  }); // return user + token // 
  
  // GET /auth/me (protected) // who am i logged in right now ? //
  app.get("/auth/me", { preHandler: (app as any).authenticate }, async (req: any) => { // who am I ? 
  					// preHandler part verifies JWT, sets req.user //
    const payload = req.user as JwtPayload; // JwtPayload now lives inside req.user (sub, e-mail, role) //
    
    const me = await prisma.user.findUnique({ // ensure user still exists, get fresh data, not only trusting token //
      where: { id: payload.sub },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });
    
    return { me }; // Frontend uses this to show profile, check role, display name / email. //
  });
}


Signup/Login
   │
   ▼
bcrypt → Prisma → JWT sign
   │
   ▼
Client stores token
   │
   ▼
Future requests
   │
   ▼
authenticate middleware
   │
   ▼
req.user populated
   │
   ▼
Routes know who you are

token goes in authorization header. Authorization: Bearer <token>

auth.ts handles user signup and login by hashing passwords, issuing JWTs, and exposing a protected endpoint to retrieve the authenticated user’s identity.
