"use server";

import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/session";

function stringOrNull(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  return raw.length > 0 ? raw : null;
}

function redirectWith(basePath: string, message: string, isError = false) {
  const queryKey = isError ? "err" : "ok";
  redirect(`${basePath}?${queryKey}=${encodeURIComponent(message)}`);
}

export async function sendPushNotificationWithRedirect(formData: FormData, redirectPath: string) {
  await requireAdminSession();

  const targetType = String(formData.get("target_type") ?? "all").trim();
  const userId = String(formData.get("user_id") ?? "").trim();
  const topic = String(formData.get("topic") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const imageUrl = stringOrNull(formData.get("image_url"));
  const deepLink = stringOrNull(formData.get("deep_link"));
  const orderId = stringOrNull(formData.get("order_id"));

  if (!["all", "user", "topic"].includes(targetType)) {
    redirectWith(redirectPath, "Invalid target type", true);
  }

  if (!title || !body) {
    redirectWith(redirectPath, "Title and body are required", true);
  }

  if (targetType === "user" && !userId) {
    redirectWith(redirectPath, "User ID is required for user notifications", true);
  }

  if (targetType === "topic" && !topic) {
    redirectWith(redirectPath, "Topic is required for topic notifications", true);
  }

  const backendBaseUrl =
    process.env.NOTIFICATION_BACKEND_URL ?? process.env.BACKEND_URL ?? "http://app.dezign-lab.com:3000";
  const adminKey = process.env.NOTIFICATION_ADMIN_KEY;

  if (!adminKey) {
    redirectWith(redirectPath, "NOTIFICATION_ADMIN_KEY is missing in admin env", true);
  }
  const adminKeyValue = adminKey ?? "";

  const payload = {
    targetType,
    ...(targetType === "user" ? { userId } : {}),
    ...(targetType === "topic" ? { topic } : {}),
    title,
    body,
    ...(imageUrl ? { imageUrl } : {}),
    ...(deepLink ? { deepLink } : {}),
    data: {
      ...(orderId ? { order_id: orderId } : {}),
    },
  };

  const response = await fetch(`${backendBaseUrl}/api/notifications/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-notification-admin-key": adminKeyValue,
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const rawText = await response.text();

  if (!response.ok) {
    let details = "Failed to send notification";
    try {
      const data = JSON.parse(rawText) as { message?: string };
      if (data?.message) details = data.message;
    } catch {
      // ignore json parse errors
    }
    redirectWith(redirectPath, details, true);
  }

  redirectWith(redirectPath, "Push notification sent successfully");
}

export async function sendPushNotificationAction(formData: FormData) {
  return sendPushNotificationWithRedirect(formData, "/notifications");
}