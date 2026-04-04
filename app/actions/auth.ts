"use server";

import { redirect } from "next/navigation";
import { clearAdminSession, getAdminCredentials, setAdminSession } from "@/lib/session";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const admin = getAdminCredentials();
  if (email !== admin.email || password !== admin.password) {
    redirect("/?error=Invalid+credentials");
  }

  await setAdminSession(email);
  redirect("/dashboard");
}

export async function logoutAction() {
  await clearAdminSession();
  redirect("/");
}
