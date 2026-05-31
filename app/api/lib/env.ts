import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optional(name: string): string {
  return process.env[name]?.trim() ?? "";
}

export const env = {
  appSecret: required("APP_SECRET"),
  isProduction: process.env.NODE_ENV === "production",
  databaseUrl: process.env.NODE_ENV === "production" ? required("DATABASE_URL") : optional("DATABASE_URL"),
  adminEmail: process.env.ADMIN_EMAIL ?? "",
  adminPassword: process.env.ADMIN_PASSWORD ?? "",
  allowScriptExecution: process.env.ALLOW_SCRIPT_EXECUTION === "1",
  ollaApiUrl: process.env.OLLA_API_URL ?? "",
  ollaModel: process.env.OLLA_MODEL ?? "llama2",
  pythonServiceUrl: process.env.PYTHON_SERVICE_URL ?? "http://127.0.0.1:8000",
  appName: process.env.VITE_APP_NAME ?? "Cybersecurity Lab",
  ownerEmail: process.env.OWNER_EMAIL ?? "",
};
