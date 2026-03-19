// server/lib/emailService.js
// Email + in-app notification service powered by Resend (resend.com).
// Gracefully no-ops when RESEND_API_KEY is not set.

import { Resend } from "resend";
import { supabaseAdmin } from "./supabaseAdmin.js";
import logger from "./logger.js";

// ── Resend client (lazy — only created when API key is present) ─────────────
let resend = null;
if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
}

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || process.env.ALLOWED_ORIGIN || "http://localhost:5173";
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "noreply@unieasy.in";

// ═══════════════════════════════════════════════════════════════════════════════
// EMAIL TEMPLATES
// ═══════════════════════════════════════════════════════════════════════════════

const templates = {
  ad_approved: (data) => ({
    subject: `[UniEasy] Your ad "${data.adTitle}" is now live!`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;padding:24px;">
        <h2 style="color:#6366f1;">Great news, ${data.merchantName}!</h2>
        <p>Your ad <strong>${data.adTitle}</strong> has been approved and is now showing to students.</p>
        <p>It will run until <strong>${data.expiresAt || "the configured end date"}</strong>.</p>
        <p><a href="${CLIENT_ORIGIN}/merchant" style="color:#6366f1;font-weight:600;">View your ad dashboard →</a></p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;"/>
        <p style="font-size:12px;color:#9ca3af;">You received this because you're a UniEasy merchant.</p>
      </div>`,
  }),

  ad_rejected: (data) => ({
    subject: `[UniEasy] Your ad "${data.adTitle}" needs changes`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;padding:24px;">
        <h2 style="color:#ef4444;">Hi ${data.merchantName},</h2>
        <p>Your ad <strong>${data.adTitle}</strong> was not approved.</p>
        <p><strong>Reason:</strong> ${data.reason || "No reason provided."}</p>
        <p>Please revise and resubmit from your <a href="${CLIENT_ORIGIN}/merchant" style="color:#6366f1;font-weight:600;">dashboard</a>.</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;"/>
        <p style="font-size:12px;color:#9ca3af;">You received this because you're a UniEasy merchant.</p>
      </div>`,
  }),

  merchant_upgrade_approved: (data) => ({
    subject: `[UniEasy] Welcome aboard, ${data.businessName}! You're now a Merchant.`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;padding:24px;">
        <h2 style="color:#22c55e;">Congratulations, ${data.userName}!</h2>
        <p>Your merchant account for <strong>${data.businessName}</strong> has been approved.</p>
        <p>You can now submit ads from your <a href="${CLIENT_ORIGIN}/merchant" style="color:#6366f1;font-weight:600;">merchant dashboard</a>.</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;"/>
        <p style="font-size:12px;color:#9ca3af;">You received this because you applied for a UniEasy merchant account.</p>
      </div>`,
  }),

  merchant_upgrade_rejected: (data) => ({
    subject: `[UniEasy] Merchant Application Update`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;padding:24px;">
        <h2 style="color:#ef4444;">Hi ${data.userName},</h2>
        <p>Your merchant application for <strong>${data.businessName}</strong> was not approved at this time.</p>
        <p><strong>Reason:</strong> ${data.reason || "No reason provided."}</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;"/>
        <p style="font-size:12px;color:#9ca3af;">You received this because you applied for a UniEasy merchant account.</p>
      </div>`,
  }),

  new_ad_submitted: (data) => ({
    subject: `[UniEasy Admin] New ad awaiting review from ${data.merchantName}`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;padding:24px;">
        <h2 style="color:#f59e0b;">New Ad Submission</h2>
        <p><strong>Merchant:</strong> ${data.merchantName} (${data.merchantEmail})</p>
        <p><strong>Ad Title:</strong> ${data.adTitle}</p>
        <p><a href="${CLIENT_ORIGIN}/admin" style="color:#6366f1;font-weight:600;">Review in Admin Dashboard →</a></p>
      </div>`,
  }),

  new_review: (data) => ({
    subject: `[UniEasy] New review for ${data.placeName}`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;padding:24px;">
        <h2 style="color:#6366f1;">New Review</h2>
        <p><strong>Place:</strong> ${data.placeName}</p>
        <p><strong>Rating:</strong> ${"★".repeat(data.rating)}${"☆".repeat(5 - data.rating)}</p>
        <p><strong>Review:</strong> ${data.body}</p>
      </div>`,
  }),
};

// ═══════════════════════════════════════════════════════════════════════════════
// SEND EMAIL
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Send an email using a predefined template.
 * @param {string} templateId - Key from the `templates` map.
 * @param {string} toEmail    - Recipient email address.
 * @param {string} toName     - Recipient display name.
 * @param {object} data       - Template interpolation data.
 * @returns {Promise<boolean>} true if sent successfully, false otherwise.
 */
export async function sendEmail(templateId, toEmail, toName, data) {
  if (!resend) {
    logger.info({ templateId, toEmail }, "[emailService] No RESEND_API_KEY set. Email not sent.");
    return false;
  }

  const template = templates[templateId];
  if (!template) {
    logger.error({ templateId }, "[emailService] Unknown template");
    return false;
  }

  const { subject, html } = template(data);

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: [toEmail],
      subject,
      html,
    });
    logger.info({ templateId, toEmail }, `[emailService] Sent`);
    return true;
  } catch (err) {
    logger.error({ err, templateId, toEmail }, "[emailService] Failed to send");
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFY ALL ADMIN + SUPERADMIN EMAILS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Send an email to every admin and superadmin user.
 * @param {string} templateId - Key from the `templates` map.
 * @param {object} data       - Template interpolation data.
 */
export async function notifyAdminEmails(templateId, data) {
  try {
    const { data: admins } = await supabaseAdmin
      .from("app_users")
      .select("email, full_name")
      .in("role", ["admin", "superadmin"]);

    if (!admins || admins.length === 0) {
      logger.info("[emailService] No admin/superadmin users found for notification");
      return;
    }

    await Promise.all(
      admins.map((a) => sendEmail(templateId, a.email, a.full_name, data))
    );
  } catch (err) {
    logger.error({ err }, "[emailService] notifyAdminEmails failed");
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// INSERT IN-APP NOTIFICATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Insert a row into the `notifications` table for in-app display.
 * @param {string} clerkUserId - Recipient's clerk_user_id.
 * @param {string} type        - Notification type (matches template IDs).
 * @param {string} title       - Short notification title.
 * @param {string} body        - Short notification body.
 * @param {string} link        - Frontend route to navigate to on click.
 * @param {object} meta        - Extra metadata (adId, merchantId, etc.).
 */
export async function insertNotification(clerkUserId, type, title, body, link = null, meta = {}) {
  try {
    const { error } = await supabaseAdmin.from("notifications").insert({
      clerk_user_id: clerkUserId,
      type,
      title,
      body,
      link,
      meta,
      is_read: false,
    });
    if (error) {
      logger.error({ err: error, clerkUserId, type }, "[emailService] Failed to insert notification");
    }
  } catch (err) {
    logger.error({ err }, "[emailService] insertNotification unexpected error");
  }
}

/**
 * Insert an in-app notification for every admin + superadmin.
 * @param {string} type  - Notification type.
 * @param {string} title - Short notification title.
 * @param {string} body  - Short notification body.
 * @param {string} link  - Frontend route to navigate to on click.
 * @param {object} meta  - Extra metadata.
 */
export async function insertAdminNotifications(type, title, body, link = null, meta = {}) {
  try {
    const { data: admins } = await supabaseAdmin
      .from("app_users")
      .select("clerk_user_id")
      .in("role", ["admin", "superadmin"]);

    if (!admins || admins.length === 0) return;

    const rows = admins.map((a) => ({
      clerk_user_id: a.clerk_user_id,
      type,
      title,
      body,
      link,
      meta,
      is_read: false,
    }));

    const { error } = await supabaseAdmin.from("notifications").insert(rows);
    if (error) {
      logger.error({ err: error }, "[emailService] Failed to insert admin notifications");
    }
  } catch (err) {
    logger.error({ err }, "[emailService] insertAdminNotifications unexpected error");
  }
}
