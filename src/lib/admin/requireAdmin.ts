import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { getOptionalUser } from "@/lib/auth";
import { isAdminUser } from "@/lib/admin/isAdminUser";

export class AdminUnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "AdminUnauthorizedError";
  }
}

/** Returns the signed-in user or redirects non-admins to home. */
export async function requireAdminPage(): Promise<User> {
  const user = await getOptionalUser();
  if (!user || !(await isAdminUser(user))) {
    redirect("/");
  }
  return user;
}

/** For server actions / API routes — throws if not admin. */
export async function requireAdminSession(): Promise<User> {
  const user = await getOptionalUser();
  if (!user || !(await isAdminUser(user))) {
    throw new AdminUnauthorizedError();
  }
  return user;
}
