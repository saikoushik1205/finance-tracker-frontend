const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

const allowedEnvironments = ["development", "test", "uat", "production"];
const nodeEnv = process.env.NODE_ENV || "development";

if (!allowedEnvironments.includes(nodeEnv)) {
  throw new Error(
    `Invalid NODE_ENV "${nodeEnv}". Expected one of: ${allowedEnvironments.join(", ")}.`,
  );
}

process.env.NODE_ENV = nodeEnv;

const envFile = `.env.${nodeEnv}`;
const envPath = path.resolve(process.cwd(), envFile);

if (fs.existsSync(envPath)) {
  const result = dotenv.config({ path: envPath });

  if (result.error) {
    throw new Error(`Failed to load ${envFile}: ${result.error.message}`);
  }
}

const requiredVariables = ["PORT", "MONGO_URI", "JWT_SECRET"];
const missingVariables = requiredVariables.filter(
  (key) => !process.env[key] || process.env[key].trim() === "",
);

if (missingVariables.length > 0) {
  throw new Error(
    [
      "Missing required environment variables:",
      ...missingVariables.map((key) => `- ${key}`),
      `Expected values in ${envFile} or the host environment.`,
    ].join("\n"),
  );
}

const port = Number.parseInt(process.env.PORT, 10);

if (!Number.isInteger(port) || port <= 0) {
  throw new Error("PORT must be a positive integer.");
}

const config = {
  env: nodeEnv,
  isDevelopment: nodeEnv === "development",
  isTest: nodeEnv === "test",
  isUat: nodeEnv === "uat",
  isProduction: nodeEnv === "production",
  port,
  mongo: {
    uri: process.env.MONGO_URI,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  },
  cors: {
    origin: process.env.FRONTEND_URL || "*",
  },
  isVercel: process.env.VERCEL === "1",
};

module.exports = config;
