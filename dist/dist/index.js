// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/storage.ts
import { randomUUID } from "crypto";
var MemStorage = class {
  users;
  feedbacks;
  quizResults;
  news;
  constructor() {
    this.users = /* @__PURE__ */ new Map();
    this.feedbacks = /* @__PURE__ */ new Map();
    this.quizResults = /* @__PURE__ */ new Map();
    this.news = /* @__PURE__ */ new Map();
    this.initializeNews();
  }
  initializeNews() {
    const sampleNews = [
      {
        id: randomUUID(),
        title: "Nouvelles Proc\xE9dures d'Appel en Vigueur",
        content: "De nouvelles proc\xE9dures simplifi\xE9es pour les appels civils entrent en vigueur \xE0 partir du 1er janvier 2024. Ces changements visent \xE0 acc\xE9l\xE9rer le traitement des dossiers et am\xE9liorer l'acc\xE8s \xE0 la justice.",
        category: "procedure",
        priority: "urgent",
        publishedAt: /* @__PURE__ */ new Date("2023-12-15")
      },
      {
        id: randomUUID(),
        title: "Digitalisation des Dossiers",
        content: "La cour adopte progressivement un syst\xE8me num\xE9rique pour tous les dossiers d'appel. Cette modernisation permettra un suivi en temps r\xE9el et une gestion plus efficace des proc\xE9dures.",
        category: "procedure",
        priority: "normal",
        publishedAt: /* @__PURE__ */ new Date("2023-12-10")
      },
      {
        id: randomUUID(),
        title: "Sessions d'Information Publique",
        content: "Participez \xE0 nos sessions gratuites sur les droits et proc\xE9dures d'appel. Ces sessions sont ouvertes \xE0 tous les citoyens et se d\xE9roulent chaque premier mercredi du mois.",
        category: "formation",
        priority: "normal",
        publishedAt: /* @__PURE__ */ new Date("2023-12-05")
      }
    ];
    sampleNews.forEach((news2) => this.news.set(news2.id, news2));
  }
  async getUser(id) {
    return this.users.get(id);
  }
  async getUserByUsername(username) {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  async createUser(insertUser) {
    const id = randomUUID();
    const user = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  async createFeedback(insertFeedback) {
    const id = randomUUID();
    const feedback2 = {
      ...insertFeedback,
      id,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.feedbacks.set(id, feedback2);
    return feedback2;
  }
  async getFeedbacks() {
    return Array.from(this.feedbacks.values()).sort(
      (a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)
    );
  }
  async createQuizResult(insertResult) {
    const id = randomUUID();
    const result = {
      ...insertResult,
      id,
      completedAt: /* @__PURE__ */ new Date()
    };
    this.quizResults.set(id, result);
    return result;
  }
  async getQuizResults() {
    return Array.from(this.quizResults.values()).sort(
      (a, b) => (b.completedAt?.getTime() || 0) - (a.completedAt?.getTime() || 0)
    );
  }
  async createNews(insertNews) {
    const id = randomUUID();
    const news2 = {
      ...insertNews,
      id,
      publishedAt: /* @__PURE__ */ new Date(),
      priority: insertNews.priority || "normal"
    };
    this.news.set(id, news2);
    return news2;
  }
  async getNews() {
    return Array.from(this.news.values()).sort(
      (a, b) => (b.publishedAt?.getTime() || 0) - (a.publishedAt?.getTime() || 0)
    );
  }
  async getNewsByCategory(category) {
    return Array.from(this.news.values()).filter((news2) => news2.category === category).sort((a, b) => (b.publishedAt?.getTime() || 0) - (a.publishedAt?.getTime() || 0));
  }
};
var storage = new MemStorage();

// shared/schema.ts
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull()
});
var feedback = pgTable("feedback", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull(),
  rating: integer("rating").notNull(),
  category: text("category").notNull(),
  message: text("message").notNull(),
  privacyAccepted: boolean("privacy_accepted").notNull(),
  createdAt: timestamp("created_at").default(sql`now()`)
});
var quizResults = pgTable("quiz_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  score: integer("score").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  answers: text("answers").notNull(),
  // JSON string of answers
  completedAt: timestamp("completed_at").default(sql`now()`)
});
var news = pgTable("news", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull(),
  priority: text("priority").notNull().default("normal"),
  publishedAt: timestamp("published_at").default(sql`now()`)
});
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true
});
var insertFeedbackSchema = createInsertSchema(feedback).omit({
  id: true,
  createdAt: true
});
var insertQuizResultSchema = createInsertSchema(quizResults).omit({
  id: true,
  completedAt: true
});
var insertNewsSchema = createInsertSchema(news).omit({
  id: true,
  publishedAt: true
});

// server/routes.ts
import { z } from "zod";
async function registerRoutes(app2) {
  app2.post("/api/feedback", async (req, res) => {
    try {
      const validatedData = insertFeedbackSchema.parse(req.body);
      const feedback2 = await storage.createFeedback(validatedData);
      res.json({ success: true, feedback: feedback2 });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          details: error.errors
        });
      }
      res.status(500).json({
        success: false,
        error: "Failed to submit feedback"
      });
    }
  });
  app2.get("/api/feedback", async (req, res) => {
    try {
      const feedbacks = await storage.getFeedbacks();
      res.json(feedbacks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch feedback" });
    }
  });
  app2.post("/api/quiz-results", async (req, res) => {
    try {
      const validatedData = insertQuizResultSchema.parse(req.body);
      const result = await storage.createQuizResult(validatedData);
      res.json({ success: true, result });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          details: error.errors
        });
      }
      res.status(500).json({
        success: false,
        error: "Failed to save quiz result"
      });
    }
  });
  app2.get("/api/quiz-results", async (req, res) => {
    try {
      const results = await storage.getQuizResults();
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch quiz results" });
    }
  });
  app2.get("/api/news", async (req, res) => {
    try {
      const { category } = req.query;
      const news2 = category && typeof category === "string" ? await storage.getNewsByCategory(category) : await storage.getNews();
      res.json(news2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch news" });
    }
  });
  app2.get("/api/forms/:formId/download", (req, res) => {
    const { formId } = req.params;
    const { format } = req.query;
    res.json({
      success: true,
      downloadUrl: `/documents/${formId}.${format}`,
      message: "Document would be downloaded in a real implementation"
    });
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      ),
      await import("@replit/vite-plugin-dev-banner").then(
        (m) => m.devBanner()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
