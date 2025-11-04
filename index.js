import express from "express";
import { createClient } from "@supabase/supabase-js";

const app = express();

// Replit fournit un PORT via process.env.PORT
const PORT = process.env.PORT || 5000;

// connexion à Supabase
const supabase = createClient(
  "https://rnjmuueteihgnhpmnehn.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// route test
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Kolors API on Replit" });
});

// route principale
app.get("/recommend", async (req, res) => {
  const { colors, style, budget } = req.query;

  if (!colors || !budget) {
    return res.status(400).json({
      error: "missing parameters (colors, budget)",
    });
  }

  const colorsStr = Array.isArray(colors) ? colors.join(",") : colors;
  const colorArray = colorsStr.split(",").map((c) => c.trim().toLowerCase());
  const maxBudget = parseFloat(budget);

  const { data: products, error } = await supabase
    .from("product")
    .select("title, price, style, colors, image_url, description")
    .lte("price", maxBudget);

  if (error) {
    console.error(error);
    return res.status(500).json({ error: "supabase error" });
  }

  const scored = (products || []).map((p) => {
    let score = 0;

    if (Array.isArray(p.colors)) {
      const matchCount = p.colors.filter((c) =>
        colorArray.includes(String(c).toLowerCase())
      ).length;
      score += matchCount * 10;
    }

    if (
      style &&
      typeof p.style === "string" &&
      p.style.toLowerCase().includes(style.toLowerCase())
    ) {
      score += 5;
    }

    return { ...p, score };
  });

  const top = scored.sort((a, b) => b.score - a.score).slice(0, 5);
  return res.json(top);
});

// démarrer le serveur
app.listen(PORT, "0.0.0.0", () => {
  console.log("✅ Kolors API running on Replit, port", PORT);
});
