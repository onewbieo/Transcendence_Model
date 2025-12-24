// src/prisma.ts
import "dotenv/config"; // loads .env into process.env this is important if not process.env would be undefined //
import { PrismaClient } from "@prisma/client"; // this one is from PrismaClient folder in node modules //
						// this gives you prisma.user.findUnique(), //
						// prisma.match.create() //
						// file is auto-generated when you run npx prisma generate //
import { PrismaPg } from "@prisma/adapter-pg"; // this one is from PrismaPg folder in node modules //
						// use postgreSQL via pg Pool connections //
import { Pool } from "pg";	// this one is from Pool folder in node modules //
				// official postgreSQL driver for Node.js //
				// Manages multiple DB connections efficiently //
				// reuses connections instead of opening a new one per query // 

const connectionString = process.env.DATABASE_URL; // DATABASE_URL is defined in our .env file. we are taking the string to that "string" we declared inside DATABASE_URL in .env ? 
if (!connectionString) {
  throw new Error("DATABASE_URL is missing. Check backend/.env"); // if string == NULL, error out //
}

const pool = new Pool({ connectionString }); // Creating the PostgreSQL pool //
						// Opens a managed connection pool to Postgres // 
const adapter = new PrismaPg(pool); // Wraps the PostgreSQL pool //
				   // Translates Prisma queries into PostgreSQL queries //
				   // acts as a bridge between Prisma and pg //

export const prisma = new PrismaClient({ adapter }); // Create one Prisma client, configure it to use PostgreSQL, The shared pool, The adapter //


Create a single Prisma client using a PostgreSQL connection pool and adapter, loading the database URL from environment variables so all routes can safely access the database. 

In short, how you use prisma to connect to the database.

.env
  ↓
dotenv/config
  ↓
DATABASE_URL
  ↓
pg Pool (connection manager)
  ↓
PrismaPg adapter
  ↓
PrismaClient
  ↓
export prisma
  ↓
routes (users, auth, matches)
