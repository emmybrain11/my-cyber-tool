import * as cookie from "cookie";
import { Errors } from "@contracts/errors";
import { getSessionCookieOptions } from "./lib/cookies";
import { signSessionToken, verifySessionToken } from "./session";
import { env } from "./lib/env";
import type { User } from "@db/schema";

export async function authenticateRequest(headers: Headers) {
  const cookies = cookie.parse(headers.get("cookie") || "");
  const token = cookies["sentinel_sid"];
  if (!token) {
    throw Errors.unauthorized("Invalid authentication token.");
  }

  const claim = await verifySessionToken(token);
  if (!claim) {
    throw Errors.unauthorized("Invalid authentication token.");
  }
  // Fetch user record from Python service
  const res = await fetch(`${env.pythonServiceUrl}/auth/user?email=${encodeURIComponent(claim.unionId)}`);
  if (!res.ok) {
    throw Errors.unauthorized("User is not approved or does not exist.");
  }
  const user = await res.json();
  if (!user || !user.approved) {
    throw Errors.unauthorized("User is not approved or does not exist.");
  }
  return user;
}

export async function loginWithEmail(
  email: string,
  password: string,
): Promise<{ token: string; user: User }> {
  if (!email || !password) {
    throw Errors.badRequest("Email and password are required.");
  }
  // Delegate authentication to Python service
  const res = await fetch(`${env.pythonServiceUrl}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    if (res.status === 401) throw Errors.unauthorized("Email or password is incorrect.");
    throw Errors.internal(`Authentication service error: ${res.status}`);
  }
  const authResponse = await res.json();
  const user = authResponse?.user ?? authResponse;
  if (!user?.approved) throw Errors.unauthorized("Your account is pending approval.");
  const token = await signSessionToken({ unionId: user.unionId, clientId: "local" });
  return { token, user };
}

export async function registerUser(
  email: string,
  password: string,
  name?: string,
): Promise<User> {
  if (!email || !password) {
    throw Errors.badRequest("Email and password are required.");
  }
  // Delegate user creation to Python service
  const res = await fetch(`${env.pythonServiceUrl}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name }),
  });
  if (!res.ok) {
    if (res.status === 400) throw Errors.badRequest("Email is already registered.");
    throw Errors.internal(`Registration service error: ${res.status}`);
  }
  const registerResponse = await res.json();
  const user = registerResponse?.user ?? registerResponse;
  return user as User;
}

export function setSessionCookie(headers: Headers, token: string) {
  const cookieOpts = getSessionCookieOptions(headers);
  headers.append(
    "set-cookie",
    cookie.serialize("sentinel_sid", token, {
      httpOnly: cookieOpts.httpOnly,
      path: cookieOpts.path,
      sameSite: cookieOpts.sameSite?.toLowerCase() as "lax" | "strict" | "none",
      secure: cookieOpts.secure,
      maxAge: 60 * 60 * 24 * 365,
      ...(cookieOpts.priority ? { priority: cookieOpts.priority.toLowerCase() as "low" | "medium" | "high" } : {}),
    }),
  );
}
