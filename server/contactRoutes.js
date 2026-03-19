// server/contactRoutes.js
// Public contact form endpoint — no auth required.
// Uses supabaseAdmin (service_role key) to bypass RLS on contact_messages.

import { Router } from "express";
import { supabaseAdmin } from "./lib/supabaseAdmin.js";
import logger from "./lib/logger.js";

const router = Router();

/**
 * POST /api/contact — Submit a contact form message.
 * Public endpoint, no authentication required.
 */
router.post("/contact", async (req, res) => {
  const { name, email, phone, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: "Missing required fields: name, email, subject, message" });
  }

  try {
    const { error } = await supabaseAdmin.from("contact_messages").insert({
      name,
      email,
      phone: phone || null,
      subject,
      message,
    });

    if (error) {
      logger.error({ err: error }, "POST /api/contact insert error");
      return res.status(500).json({ error: error.message });
    }

    logger.info({ email, subject }, "POST /api/contact success");
    return res.json({ success: true });
  } catch (err) {
    logger.error({ err }, "POST /api/contact unexpected error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
