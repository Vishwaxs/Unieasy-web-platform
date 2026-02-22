// server/lib/notifyAdmins.js
// Simple admin notification helper.
// Uses nodemailer if ADMIN_NOTIFICATION_EMAIL and SMTP_* env vars are set.
// Otherwise falls back to console.log.

import { supabaseAdmin } from "./supabaseAdmin.js";
import "dotenv/config";

/**
 * Send a notification to admin/superadmin users about an event.
 * @param {string} message - Human-readable message
 * @param {object} meta   - Extra context (adId, submittedBy, etc.)
 */
export async function notifyAdmins(message, meta = {}) {
  // 1. Find admin emails from app_users
  const { data: admins, error } = await supabaseAdmin
    .from("app_users")
    .select("email, full_name, role")
    .in("role", ["admin", "superadmin"]);

  if (error) {
    console.error("[notifyAdmins] Failed to fetch admin users:", error.message);
  }

  const adminEmails = (admins || []).map((u) => u.email).filter(Boolean);

  // 2. Check if email sending is configured
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;

  if (smtpHost && smtpUser && smtpPass && adminEmail) {
    try {
      // Dynamic import to avoid crashes if nodemailer not installed
      const nodemailer = await import("nodemailer");
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(process.env.SMTP_PORT || "587", 10),
        secure: process.env.SMTP_SECURE === "true",
        auth: { user: smtpUser, pass: smtpPass },
      });

      const recipients = adminEmails.length > 0 ? adminEmails.join(", ") : adminEmail;

      await transporter.sendMail({
        from: smtpUser,
        to: recipients,
        subject: "[UniEasy Admin] " + message.slice(0, 80),
        text: `${message}\n\nDetails: ${JSON.stringify(meta, null, 2)}`,
      });

      console.log(`[notifyAdmins] Email sent to ${recipients}`);
    } catch (emailErr) {
      console.error("[notifyAdmins] Email sending failed:", emailErr.message);
      // Fall through to console log below
    }
  } else {
    // Fallback: console log
    console.log("───────────────────────────────────────────────");
    console.log("[notifyAdmins] ADMIN NOTIFICATION");
    console.log("  Message:", message);
    console.log("  Meta:", JSON.stringify(meta));
    console.log("  Admin emails:", adminEmails.join(", ") || "(none found)");
    console.log("  Tip: Set SMTP_HOST, SMTP_USER, SMTP_PASS, ADMIN_NOTIFICATION_EMAIL to enable email.");
    console.log("───────────────────────────────────────────────");
  }
}
