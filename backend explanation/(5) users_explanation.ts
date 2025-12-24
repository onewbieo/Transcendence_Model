import type { FastifyInstance } from "fastify"; // ensure app has correct fastify methods //
import bcrypt from "bcrypt"; // for password hashing and verifying //
import { prisma } from "../prisma"; // database client //
				// prisma.user.* runs queries on user table //

export async function userRoutes(app: FastifyInstance) { // receives the fastify app //
							// registers userRoutes onto it //
  // ME ROUTES FIRST
  // GET /users/me (protected)
  app.get( // show my own profile //
    "/users/me",
    { preHandler: (app as any).authenticate }, // preHandler - verifies logged in // 
    						// authenticate we do await. req.jwtVerify(), if ok sets req.user //
    async (req: any) => {
    const payload = req.user as { sub: number; email: string }; // read sub and e-mail and now lives in req.user //
    
    const me = await prisma.user.findUnique({ // ensure user still exists, get fresh data, not only trusting tokens // 
      where: { id: payload.sub }, // target user id from payload // 
      select: { id: true, email: true, name: true, role: true, createdAt: true }, // controls what prisma sends back to you //
    });
    
    return { me }; // "me" : { id:, e-mail, name, role, createdAt } //
  });
  
  // PATCH /users/me (protected) update my profile
  app.patch( // update my own name //
    "/users/me",
    { preHandler: (app as any).authenticate }, // protected route - needs to verify the login first // 
    async (req: any, reply) => { // uses reply becaue you might send custom error codes //
      const payload = req.user as { sub: number; email: string }; // read sub and e-mail and now lives in req.user //
      const body = req.body as { name?: string }; // read name and now lives in req.body //
    
      const name = body.name?.trim(); // trim if it sends spacing //
    if (name !== undefined && name.length === 0) { // if name is provided but becomes empty after trim - reject //
      return reply.code(400).send({ error: "name cannot be empty" });
    }
    
      const user = await prisma.user.update({ // update the current user. if name is undefined, Prisma doesnt change the name field //
        where: { id: payload.sub }, // target user id from payload // // which row to update //
        data: { name: name ?? undefined }, // update name using validated value from request body //
        select: { id: true, email: true, name: true, role: true, createdAt: true }, // controls what prisma sends back to you // // what fields to return //
      }); // literally updates the name here // 
    
    return reply.send(user); // returns updated user object // 
  });
  
  // PATCH /users/me/password (protected)
  app.patch( // changing of password // 
    "/users/me/password",
    { preHandler: (app as any).authenticate },  // verifies login // 
    async (req: any, reply) => { // reply in case custom erro codes needs to be sent //
    const payload = req.user as { sub: number }; // only need user id here //
    
    const body = req.body as { // read oldPassword, and new password //
      oldPassword?: string; // oldPassword can be undefined, we validate required //
      newPassword?: string; // newPassword can be undefined, we validate required // 
    };
    
    if (!body.oldPassword || !body.newPassword) { // if either is missing / empty error out //
      return reply.code(400).send({
        error: "oldPassword and newPassword are required",
      });
    }
    
    if (body.newPassword.length < 8) { // if character length not enough error out // 
      return reply.code(400).send({
        error: "new password must be at least 8 characters",
      });
    }
    
    const user = await prisma.user.findUnique({ // lookup current user and load it //
      where: { id: payload.sub }, // authenticated user identity (JWT) //
    });
    
    if (!user) {
      return reply.code(404).send({ error: "user not found" });
    }
    
    const ok = await bcrypt.compare(body.oldPassword, user.passwordHash); // compares plaintext oldPassword against stored bcrypt hash (bcrypt handles salt internally)
    if (!ok) {
      return reply.code(401).send({ error: "invalid old password" });
    }
    
    const newHash = await bcrypt.hash(body.newPassword, 10); // hashes new password and stores it //
    
    await prisma.user.update({
      where: {id: payload.sub }, // target user id from payload // // which row to update //
      data: { passwordHash: newHash }, // store new hashed password //
    }); // updates password //

    return reply.send({ ok: true }); // send successful response to the client, saying operation worked. //
    }
  );
  
  // GET /users/:id (protected) - view another user's public profile
  app.get( // View another user // 
    "/users/:id",
    { preHandler: (app as any).authenticate }, // User must be logged in to do that //
    async (req: any, reply) => {
      const params = req.params as { id: string }; // URL params comes as strings, convert to number //
      const id = Number(params.id);

      if (!Number.isFinite(id)) { // validate if its a real number //
        return reply.code(400).send({ error: "invalid id" });
      }

      const user = await prisma.user.findUnique({ // lookup based on id //
        where: { id }, // target user id from URL param //
        select: { id: true, name: true, createdAt: true }, // controls what prisma sends back to you //
      }); // dont return e-mail or role here // 

      if (!user) {
        return reply.code(404).send({ error: "user not found" });
      }

      return reply.send({ user }); // user: { id:, name, createdAt } //
    }
  );
  
  // ADMIN ROUTES after
  // GET /users (list all users)   // READ //
  app.get( // admin routes //
    "/admin/users",
    { preHandler: (app as any).authorizeAdmin }, // JWT must be valid, req.user.role === "ADMIN" else 403 forbidden //
    async () => {
  	return prisma.user.findMany({
  	  select: { id: true, email: true, name: true, role: true, createdAt: true },
  	});  // can see e-mail, roles here because they manage users. Returns array of users // 
    }
  ); 
  
  // GET /users/:id (get one user) // READ //
  app.get( // view one user but this includes e-mail + role // 
    "/admin/users/:id",
    { preHandler: (app as any).authorizeAdmin }, // JWT must be valid, req.user.role === "ADMIN" //
    async (req, reply) => {
    const params = req.params as { id: string }; // read id, as its string //
    const id = Number(params.id); // convert to number //
    
    if (!Number.isFinite(id)) { // checks if its a number //
      return reply.code(400).send({ error: "invalid id" });
    }
    
    const user = await prisma.user.findUnique({
      where: { id }, // target user id from URL params //
      select: { id: true, email: true, name: true, role: true, createdAt: true }, // Controls what prisma sends back to you //
    });
    
    if (!user) {
      return reply.code(404).send({ error: "user not found" });
    }
   
    return user; // "id" { id, email, name, role, createdAt } //
  });
  
  // PATCH /users/:id (update user fields, e.g. name) // UPDATE //
  app.patch(
    "/admin/users/:id",
    { preHandler: (app as any).authorizeAdmin }, // JWT must be valid, req.user.role === "ADMIN" //
    async (req, reply) => {
    const params = req.params as { id: string }; // read id, as its string //
    const id = Number(params.id); // convert to number //
    
    if (!Number.isFinite(id)) { // check if its a number //
      return reply.code(400).send({ error: "invalid id" });
    }
    
    const body = req.body as {
      name?: string;	// read name //
    };
    
    // only allow updating name for now
    const name = body.name?.trim(); // trim the name if empty space // 
    
    if (name !== undefined && name.length === 0) { // if name is provided but becomes empty after trim - reject //
      return reply.code(400).send({ error: "name cannot be empty" });
    }
    
    try {
      const user = await prisma.user.update({
        where: { id }, // target user id from URL params // // which row to update //
        data: { name: name ?? undefined, }, // update name using validated value from request body //
        select: { id: true, email: true, name: true, role: true, createdAt: true }, // controls what prisma sends back to you //
      });
      
      return reply.send(user); // sends back template of select // 
     }
     catch (err: any) {
       // Prisma throws if user not around
       if (err?.code === "P2025") { // record to update not found //
         return reply.code(404).send({ error: "user not found" });
       }
       req.log.error(err); // logs the full error internally // 
       return reply.code(500).send({ error: "internal error" });
     }
  });
  
  Prisma update
   │
   ├─ success → return updated user
   │
   └─ throws error
        │
        ├─ P2025 → 404 user not found
        │
        └─ anything else
             ├─ log error
             └─ 500 internal error
    
  /*// POST /users (create user) // CREATE //
  app.post("/users", async (req, reply) => {
    const body = req.body as {
      email?: string;
      password?: string;
      name?: string;
    };
    
    const email = body.email?.trim().toLowerCase();
    const password = body.password;
    
    if (!email || !password) {
    	return reply.code(400).send({ error: "email and password are required"});
    }
    if (password.length < 8) {
    	return reply.code(400).send({ error: "password must be at least 8 characters" });
    }
    
    // prevent duplicates nicely (instead of Prisma crashing)
    const existing = await prisma.user.findUnique({ 
      where: { email },
    });
    
    if (existing) {
      return reply.code(409).send({
        error: "email already exists",
      });
    }
    
    const passwordHash = await bcrypt.hash(password, 10);
    
    const user = await prisma.user.create({
      data: { email, name: body.name ?? null, passwordHash },
      select: { id: true, email: true, name: true, createdAt: true},
      });
    
    return reply.code(201).send(user);
  });*/
  
  // DELETE /admin/users/:id (delete user) // DELETE //
  app.delete( // deletion by admin //
    "/admin/users/:id",
    { preHandler: (app as any).authorizeAdmin }, // JWT must be valid. req.user.role === "ADMIN" //
    async (req, reply) => {
    const params = req.params as { id: string }; // read id as its string //
    const id = Number(params.id); // convert to number //
    
    if (!Number.isFinite(id)) { // check if its a number //
      return reply.code(400).send({ error: "invalid id" });
    }
    
    try {
      await prisma.user.delete({ where: { id} }); // delete based on id //
      return reply.code(204).send();
    }
    catch (err: any) {
      if (err?.code === "P2025") { // if record not found //
        return reply.code(404).send({ error: "user not found" });
      }
      req.log.error(err); // log error internally //
      return reply.code(500).send({ error: "internal error" });
    }
    }
  );
}

Client HTTP request
   │
   ▼
Fastify route match (users.ts)
   │
   ├─ if route has preHandler: authenticate
   │      ▼
   │   req.jwtVerify()
   │      ├─ fail → 401 {error:"unauthorized"}
   │      └─ ok   → req.user populated (sub/email/role)
   │
   └─ if route has preHandler: authorizeAdmin
          ▼
       req.jwtVerify()
          ├─ fail → 401 {error:"unauthorized"}
          └─ ok
             ├─ role !== ADMIN → 403 {error:"forbidden"}
             └─ role === ADMIN → continue

   ▼
Route handler runs
   │
   ▼
Prisma query (DB read/write)
   │
   ▼
Return JSON response

