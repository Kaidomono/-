import express from "express";
import path from "path";
import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Add Health Check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Lazy initialize Stripe
  let stripe: Stripe | null = null;
  const getStripe = () => {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      console.warn("STRIPE_SECRET_KEY is not set. Stripe functionality will be disabled.");
      return null;
    }

    // Sanity check for common mistakes (like putting a price or placeholder in the key)
    if (key.length < 10 || key.startsWith("$")) {
      console.error(`Invalid STRIPE_SECRET_KEY detected: "${key}". It should start with 'sk_test_' or 'sk_live_'.`);
      return null;
    }

    if (!stripe) {
      stripe = new Stripe(key);
    }
    return stripe;
  };

  app.use(express.json());

  // API Routes
  app.post("/api/create-checkout-session", async (req, res) => {
    const s = getStripe();
    if (!s) {
      return res.status(500).json({ error: "Stripe not configured" });
    }

    try {
      const session = await s.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "Steppe Legacy: Great Khan - Season Pass",
                description: "Unlock unique roles, starting wealth, and legendary items.",
              },
              unit_amount: 499, // $4.99
              recurring: {
                interval: "month",
              },
            },
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: `${req.headers.origin}/?session_id={CHECKOUT_SESSION_ID}&premium=true`,
        cancel_url: `${req.headers.origin}/`,
      });

      res.json({ url: session.url });
    } catch (error: any) {
      console.error("Stripe error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting in development mode with Vite...");
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting in production mode...");
    const distPath = path.join(process.cwd(), "dist");
    console.log(`Serving static files from: ${distPath}`);
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      const indexPath = path.join(distPath, "index.html");
      res.sendFile(indexPath, (err) => {
        if (err) {
          console.error(`Error sending index.html: ${err}`);
          res.status(500).send(err);
        }
      });
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on port ${PORT}`);
    console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
  });
}

startServer().catch((error) => {
  console.error("Fatal error during server startup:", error);
  process.exit(1);
});
