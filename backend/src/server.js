import express from "express";
import path from "path";
import { clerkMiddleware } from "@clerk/express";
import { serve } from "inngest/express";
import cors from "cors";

import { functions, inngest } from "./config/inngest.js";

import { ENV } from "./config/env.js";
import { connectDB } from "./config/db.js";

import adminRoutes from "./routes/admin.route.js";
import userRoutes from "./routes/user.route.js";
import orderRoutes from "./routes/order.route.js";
import reviewRoutes from "./routes/review.route.js";
import productRoutes from "./routes/product.route.js";
import cartRoutes from "./routes/cart.route.js";
import paymentRoutes from "./routes/payment.route.js";
import offerRoutes from "./routes/offer.route.js";

const app = express();

const __dirname = path.resolve();

app.use(express.json());
app.use(clerkMiddleware()); // adds auth object under the req => req.auth
app.use(cors({ origin: ENV.CLIENT_URL, credentials: true })); // credentials: true allows the browser to send the cookies to the server with the request
app.use((req, res, next) => {
  const startedAt = Date.now();

  res.on("finish", () => {
    console.log("[api]", JSON.stringify({
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs: Date.now() - startedAt,
      userId: req.auth?.userId || null,
    }));
  });

  next();
});

app.use("/api/inngest", serve({ client: inngest, functions }));

app.use("/api/payment", paymentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/offers", offerRoutes);

app.get("/api/health", (req, res) => {
  res.status(200).json({ message: "Success" });
});

// make our app ready for deployment
if (ENV.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../admin/dist")));

  app.get("/{*any}", (req, res) => {
    res.sendFile(path.join(__dirname, "../admin", "dist", "index.html"));
  });
}

const startServer = async () => {
  await connectDB();
  const port = Number(ENV.PORT) || 3000;
  app.listen(port, "0.0.0.0", () => {
    console.log(`Server is up and running on port ${port}`);
  });
};

startServer();
