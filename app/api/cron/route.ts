
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

export const runtime = "nodejs";

export async function GET(req: Request) {
  let stage = "Authentication";
  console.log("[CRON] API triggered");

console.log("[CRON] Environment check", {
  SUPABASE_URL: !!process.env.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY: !!process.env.VAPID_PRIVATE_KEY,
  VAPID_SUBJECT: !!process.env.VAPID_SUBJECT,
  CRON_SECRET: !!process.env.CRON_SECRET,
});
  try {
    if (
      !process.env.CRON_SECRET ||
      req.headers.get("authorization") !==
        `Bearer ${process.env.CRON_SECRET}`
    ) {
      return new Response("Unauthorized", { status: 401 });
    }

    stage = "Environment validation";

    const requiredEnv = [
      "SUPABASE_URL",
      "SUPABASE_SERVICE_ROLE_KEY",
      "NEXT_PUBLIC_VAPID_PUBLIC_KEY",
      "VAPID_PRIVATE_KEY",
      "VAPID_SUBJECT",
    ];

    const missing = requiredEnv.filter(
      (key) => !process.env[key]
    );

    if (missing.length > 0) {
      throw new Error(
        `Missing environment variables: ${missing.join(", ")}`
      );
    }

    stage = "Supabase initialization";

    const db = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    stage = "VAPID initialization";

    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT!,
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    );

    stage = "Supabase database query";

    const { data, error } = await db
      .from("hydration_reminders")
      .select("*")
      .lte("next_at", new Date().toISOString())
      .limit(100);

    if (error) {
      console.error("[CRON] Supabase error:", error);
      throw new Error(error.message);
    }

    console.log("[CRON] Due reminders:", data?.length || 0);

    stage = "Push notification delivery";

    let sent = 0;
    let failed = 0;

    for (const row of data || []) {
      const next = new Date(
        Date.now() + row.minutes * 60000
      ).toISOString();

      const { data: claimed, error: claimError } = await db
        .from("hydration_reminders")
        .update({ next_at: next })
        .eq("id", row.id)
        .eq("next_at", row.next_at)
        .select("id");

      if (claimError) {
        console.error("[CRON] Schedule update failed:", claimError);
        failed++;
        continue;
      }

      if (!claimed?.length) continue;

      try {
        await webpush.sendNotification(
          row.subscription,
          JSON.stringify({ type: "hydrate" }),
          { TTL: 120 }
        );

        sent++;
        console.log("[CRON] Notification sent");

      } catch (e) {
        failed++;

        const status = (e as { statusCode?: number }).statusCode;

        console.error("[CRON] Push delivery failed:", {
          status,
          message: e instanceof Error ? e.message : "Unknown error",
        });

        if (status === 404 || status === 410) {
          await db
            .from("hydration_reminders")
            .delete()
            .eq("id", row.id)
            .eq("next_at", next);
        }
      }
    }

    return Response.json({
      success: true,
      sent,
      failed,
    });

  } catch (error) {
    console.error("[CRON] FAILED:", {
      stage,
      message:
        error instanceof Error ? error.message : "Unknown error",
    });

    return Response.json(
      {
        success: false,
        stage,
        error: "Cron execution failed",
      },
      { status: 500 }
    );
  }
}