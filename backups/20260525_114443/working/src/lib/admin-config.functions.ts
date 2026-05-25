import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";
import { execSync } from "child_process";
import { createHash } from "crypto";
import { pool } from "@/db";

function verifyAdminPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD || "agentcore2026";
  if (password === expected) return true;
  if (password === hashPassword(expected)) return true;
  return false;
}

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex").slice(0, 32);
}

function getEnvFilePath(): string {
  const projectRoot = resolve(process.cwd());
  const envProd = resolve(projectRoot, ".env.production");
  const envBase = resolve(projectRoot, ".env");
  if (existsSync(envProd)) return envProd;
  return envBase;
}

function maskValue(value: string): string {
  if (!value) return "";
  if (value.length <= 8) return "••••" + value.slice(-2);
  return value.slice(0, 3) + "••••" + value.slice(-4);
}

function parseEnvFile(content: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    map.set(key, val);
  }
  return map;
}

function serializeEnvFile(map: Map<string, string>, originalContent: string): string {
  const lines = originalContent.split("\n");
  const written = new Set<string>();
  const result: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      result.push(line);
      continue;
    }
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) {
      result.push(line);
      continue;
    }
    const key = trimmed.slice(0, eqIdx).trim();
    if (map.has(key)) {
      result.push(`${key}=${map.get(key)}`);
      written.add(key);
    } else {
      result.push(line);
    }
  }

  for (const [key, value] of map) {
    if (!written.has(key)) {
      result.push(`${key}=${value}`);
    }
  }

  return result.join("\n");
}

const TRACKED_KEYS = [
  "SUPABASE_URL",
  "SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_PROJECT_ID",
  "VITE_SUPABASE_PUBLISHABLE_KEY",
  "YOOKASSA_SHOP_ID",
  "YOOKASSA_SECRET_KEY",
  "SLACK_CLIENT_ID",
  "SLACK_CLIENT_SECRET",
  "SLACK_SIGNING_SECRET",
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
  "RESEND_API_KEY",
  "OPENAI_API_KEY",
  "ANTHROPIC_API_KEY",
  "LOVABLE_AI_GATEWAY_KEY",
  "AGENTCORE_ENCRYPTION_KEY",
  "ADMIN_PASSWORD",
] as const;

export const verifyAdmin = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ password: z.string() }).parse(d))
  .handler(async ({ data }) => {
    if (!verifyAdminPassword(data.password)) {
      throw new Error("Неверный пароль");
    }
    return { token: hashPassword(data.password) };
  });

export const validateAdminToken = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ token: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const expected = process.env.ADMIN_PASSWORD || "agentcore2026";
    const expectedHash = hashPassword(expected);
    if (data.token !== expectedHash) {
      throw new Error("Сессия истекла");
    }
    return { valid: true };
  });

export const getAdminConfig = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({ password: z.string() }).parse(d),
  )
  .handler(async ({ data }) => {
    if (!verifyAdminPassword(data.password)) {
      throw new Error("Неверный пароль");
    }

    const envPath = getEnvFilePath();
    let rawContent = "";
    if (existsSync(envPath)) {
      rawContent = readFileSync(envPath, "utf-8");
    }

    const envMap = parseEnvFile(rawContent);
    const keys: Record<string, { value: string; masked: string; set: boolean }> = {};

    for (const key of TRACKED_KEYS) {
      const val = envMap.get(key) ?? process.env[key] ?? "";
      keys[key] = {
        value: val,
        masked: val ? maskValue(val) : "",
        set: !!val,
      };
    }

    return {
      envFile: envPath,
      keys,
      fileExists: existsSync(envPath),
    };
  });

export const updateAdminConfig = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        password: z.string(),
        values: z.record(z.string(), z.string()),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    if (!verifyAdminPassword(data.password)) {
      throw new Error("Неверный пароль");
    }

    const envPath = getEnvFilePath();
    let rawContent = "";
    if (existsSync(envPath)) {
      rawContent = readFileSync(envPath, "utf-8");
    }

    const envMap = parseEnvFile(rawContent);

    for (const [key, value] of Object.entries(data.values)) {
      if (value === "") {
        envMap.delete(key);
      } else {
        envMap.set(key, value);
      }
    }

    const newContent = serializeEnvFile(envMap, rawContent);
    writeFileSync(envPath, newContent, "utf-8");

    return { ok: true, path: envPath, restartNeeded: true };
  });

export const executeSupabaseSQL = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        password: z.string(),
        sql: z.string().min(1),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    if (!verifyAdminPassword(data.password)) {
      throw new Error("Неверный пароль");
    }

    try {
      const { rows, fields } = await pool.query(data.sql);
      return { ok: true, result: { rows, fields: fields?.map((f: any) => f.name) } };
    } catch (e: any) {
      throw new Error(`SQL error: ${e.message}`);
    }
  });

export const getServiceStatus = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({ password: z.string() }).parse(d),
  )
  .handler(async ({ data }) => {
    if (!verifyAdminPassword(data.password)) {
      throw new Error("Неверный пароль");
    }

    const services = [
      { name: "agentcore-web", label: "Web (AgentCore)" },
      { name: "agentcore-telegram-user", label: "Telegram User" },
      { name: "agentcore-whatsapp", label: "WhatsApp" },
      { name: "agentcore-worker", label: "Worker" },
      { name: "agentcore-ws", label: "WebSocket" },
      { name: "nginx", label: "Nginx" },
      { name: "postgresql", label: "PostgreSQL" },
      { name: "redis", label: "Redis" },
    ];

    const results: Array<{ name: string; label: string; status: string; active: boolean }> = [];

    for (const svc of services) {
      try {
        const out = execSync(`systemctl is-active ${svc.name} 2>/dev/null || echo "unknown"`, {
          encoding: "utf-8",
          timeout: 5000,
        }).trim();
        const active = out === "active";
        results.push({ ...svc, status: out, active });
      } catch {
        results.push({ ...svc, status: "unknown", active: false });
      }
    }

    return { services: results };
  });
