import "dotenv/config";
import cors from "cors";
import express from "express";
import authRoutes from "./routes/authRoutes.js";
import usuarioRoutes from "./routes/usuarioRoutes.js";
import diaristaRoutes from "./routes/diaristaRoutes.js";
import servicoRoutes from "./routes/servicoRoutes.js";
import { errorMiddleware, notFoundMiddleware } from "./middlewares/error.middleware.js";

export const app = express();

const allowedOrigins = process.env.CORS_ORIGIN?.split(",").map((value) => value.trim()).filter(Boolean);
app.disable("x-powered-by");
app.use(cors({ origin: allowedOrigins?.length ? allowedOrigins : false }));
app.use(express.json({ limit: "1mb" }));

app.get("/health", (req, res) => res.status(200).json({ data: { status: "ok" } }));
app.use("/api/auth", authRoutes);
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/diaristas", diaristaRoutes);
app.use("/api/servicos", servicoRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
