import { google } from "googleapis";
import { getServiceAccountCredentialsFromEnv } from "@/lib/sheetsClient";
import type { DashboardTenant, LoginAuditEvent } from "@/lib/types";

const DEFAULT_LOGIN_AUDIT_RANGE = "Logins!A:H";

function getLoginAuditSheetId() {
  return process.env.LOGIN_AUDIT_SHEET_ID?.trim() || "";
}

function getLoginAuditRange() {
  return process.env.LOGIN_AUDIT_SHEET_RANGE?.trim() || DEFAULT_LOGIN_AUDIT_RANGE;
}

async function getAuditSheetsClient() {
  const sheetId = getLoginAuditSheetId();
  const credentials = getServiceAccountCredentialsFromEnv();

  if (!sheetId || !credentials) {
    return null;
  }

  const auth = new google.auth.JWT({
    email: credentials.clientEmail,
    key: credentials.privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"]
  });

  return {
    sheetId,
    range: getLoginAuditRange(),
    sheets: google.sheets({
      version: "v4",
      auth
    })
  };
}

export function isLoginAuditConfigured() {
  return Boolean(getLoginAuditSheetId() && getServiceAccountCredentialsFromEnv());
}

export async function appendLoginAuditEvent({
  tenant,
  ipAddress,
  userAgent
}: {
  tenant: DashboardTenant;
  ipAddress?: string;
  userAgent?: string;
}) {
  const client = await getAuditSheetsClient();

  if (!client) {
    return false;
  }

  await client.sheets.spreadsheets.values.append({
    spreadsheetId: client.sheetId,
    range: client.range,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [
        [
          new Date().toISOString(),
          tenant.username,
          tenant.label,
          tenant.id,
          tenant.profile,
          tenant.role,
          tenant.canExport ? "yes" : "no",
          ipAddress || userAgent || ""
        ]
      ]
    }
  });

  return true;
}

export async function getLoginAuditEvents(limit = 100): Promise<LoginAuditEvent[]> {
  const client = await getAuditSheetsClient();

  if (!client) {
    return [];
  }

  const response = await client.sheets.spreadsheets.values.get({
    spreadsheetId: client.sheetId,
    range: client.range
  });
  const rows = response.data.values ?? [];

  return rows
    .map<LoginAuditEvent>((row) => ({
      timestamp: String(row[0] ?? ""),
      username: String(row[1] ?? ""),
      tenantLabel: String(row[2] ?? ""),
      tenantId: String(row[3] ?? ""),
      profile: String(row[4] ?? "") === "test" ? "test" : "team",
      role: String(row[5] ?? "") === "admin" ? "admin" : "member",
      canExport: String(row[6] ?? "").toLowerCase() === "yes",
      ipAddress: String(row[7] ?? "") || undefined
    }))
    .filter(
      (row) =>
        row.timestamp &&
        row.username &&
        row.tenantId &&
        row.timestamp.toLowerCase() !== "timestamp"
    )
    .sort((left, right) => right.timestamp.localeCompare(left.timestamp))
    .slice(0, limit);
}
