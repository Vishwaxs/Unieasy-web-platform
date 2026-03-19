// server/sentimentRoutes.js
// Express router for emoji sentiment polls.
// One vote per user per place. Supports upsert (change vote).

import { Router } from "express";
import { supabaseAdmin } from "./lib/supabaseAdmin.js";
import { verifyClerkToken } from "./middleware/verifyClerkToken.js";
import { isStudentEmail } from "./middleware/verifyStudent.js";
import logger from "./lib/logger.js";
import { z } from "zod";

const router = Router();

const placeIdSchema = z.string().uuid();
const sentimentSchema = z.enum(["love", "like", "neutral", "dislike", "terrible"]);

const SENTIMENTS = ["love", "like", "neutral", "dislike", "terrible"];

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/sentiment/:placeId — get vote distribution + user's own vote
// ═══════════════════════════════════════════════════════════════════════════════

router.get("/sentiment/:placeId", async (req, res) => {
  const parsed = placeIdSchema.safeParse(req.params.placeId);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid place ID format" });
  }

  const placeId = parsed.data;

  try {
    // Get aggregates from places table
    const { data: place, error: placeErr } = await supabaseAdmin
      .from("places")
      .select(
        "sentiment_love, sentiment_like, sentiment_neutral, sentiment_dislike, sentiment_terrible"
      )
      .eq("id", placeId)
      .single();

    if (placeErr || !place) {
      return res.status(404).json({ error: "Place not found" });
    }

    const distribution = {
      love: place.sentiment_love,
      like: place.sentiment_like,
      neutral: place.sentiment_neutral,
      dislike: place.sentiment_dislike,
      terrible: place.sentiment_terrible,
    };

    const total = Object.values(distribution).reduce((a, b) => a + b, 0);

    // Check if user has voted (optional — based on auth header presence)
    let userVote = null;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const { verifyToken } = await import("@clerk/express");
        const token = authHeader.split(" ")[1];
        const payload = await verifyToken(token, {
          secretKey: process.env.CLERK_SECRET_KEY,
        });
        if (payload?.sub) {
          const { data: vote } = await supabaseAdmin
            .from("sentiment_polls")
            .select("sentiment")
            .eq("place_id", placeId)
            .eq("clerk_user_id", payload.sub)
            .maybeSingle();
          userVote = vote?.sentiment || null;
        }
      } catch {
        // Token invalid — just skip userVote
      }
    }

    return res.json({ distribution, total, userVote });
  } catch (err) {
    logger.error({ err }, "GET /sentiment unexpected error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/sentiment/:placeId — submit or change vote (upsert)
// ═══════════════════════════════════════════════════════════════════════════════

router.post("/sentiment/:placeId", verifyClerkToken(), async (req, res) => {
  const placeValid = placeIdSchema.safeParse(req.params.placeId);
  if (!placeValid.success) {
    return res.status(400).json({ error: "Invalid place ID format" });
  }

  const sentimentValid = sentimentSchema.safeParse(req.body.sentiment);
  if (!sentimentValid.success) {
    return res.status(400).json({
      error: "Invalid sentiment. Use: love, like, neutral, dislike, terrible",
    });
  }

  const placeId = placeValid.data;
  const sentiment = sentimentValid.data;
  const clerkUserId = req.clerkUserId;

  try {
    // Verify student email
    const { data: user, error: userErr } = await supabaseAdmin
      .from("app_users")
      .select("email")
      .eq("clerk_user_id", clerkUserId)
      .single();

    if (userErr || !user) {
      return res.status(403).json({ error: "User not found" });
    }

    if (!isStudentEmail(user.email)) {
      return res.status(403).json({
        error: "Only verified Christ University students can vote",
      });
    }

    // Check for existing vote
    const { data: existing } = await supabaseAdmin
      .from("sentiment_polls")
      .select("id, sentiment")
      .eq("place_id", placeId)
      .eq("clerk_user_id", clerkUserId)
      .maybeSingle();

    if (existing) {
      if (existing.sentiment === sentiment) {
        // Toggle off — remove the vote
        const { error: delErr } = await supabaseAdmin
          .from("sentiment_polls")
          .delete()
          .eq("id", existing.id);
        if (delErr) {
          logger.error({ err: delErr }, "Sentiment delete error");
          return res.status(500).json({ error: delErr.message });
        }
        await updateSentimentAggregates(placeId);
        return res.json({ success: true, sentiment: null, removed: true });
      }
      // Update existing vote
      const { error: updateErr } = await supabaseAdmin
        .from("sentiment_polls")
        .update({ sentiment })
        .eq("id", existing.id);

      if (updateErr) {
        logger.error({ err: updateErr }, "Sentiment update error");
        return res.status(500).json({ error: updateErr.message });
      }
    } else {
      // Insert new vote
      const { error: insertErr } = await supabaseAdmin
        .from("sentiment_polls")
        .insert({
          place_id: placeId,
          clerk_user_id: clerkUserId,
          sentiment,
        });

      if (insertErr) {
        logger.error({ err: insertErr }, "Sentiment insert error");
        return res.status(500).json({ error: insertErr.message });
      }
    }

    // Recalculate aggregates
    await updateSentimentAggregates(placeId);

    return res.json({ success: true, sentiment });
  } catch (err) {
    logger.error({ err }, "POST /sentiment unexpected error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ── Helper: recalculate sentiment aggregates ────────────────────────────────

async function updateSentimentAggregates(placeId) {
  try {
    const { data, error } = await supabaseAdmin
      .from("sentiment_polls")
      .select("sentiment")
      .eq("place_id", placeId);

    if (error || !data) return;

    const counts = {};
    for (const s of SENTIMENTS) {
      counts[`sentiment_${s}`] = 0;
    }
    for (const row of data) {
      const key = `sentiment_${row.sentiment}`;
      if (key in counts) counts[key]++;
    }

    await supabaseAdmin
      .from("places")
      .update(counts)
      .eq("id", placeId);
  } catch (err) {
    logger.error({ err }, "updateSentimentAggregates failed");
  }
}

export default router;
