import { api } from "./client";

export type LoginResponse = {
  token: string;
  user: { id: number; email: string; name: string | null; createdAt: string };
};

export async function login(email: string, password: string): Promise<LoginResponse> {
  return api<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function me(): Promise<{
  me: { id: number; email: string; name: string | null; role: string; createdAt: string };
}> {
  return api("/users/me");
}

