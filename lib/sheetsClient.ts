import { google } from "googleapis";
import { coerceTrainingSession } from "@/lib/dataUtils";
import type { TrainingSession } from "@/lib/types";

type SheetsApiResponse = {
  values?: string[][];
};

type SheetMetadataResponse = {
  sheets?: Array<{
    properties?: {
      title?: string;
    };
  }>;
};

type ServiceAccountCredentials = {
  clientEmail: string;
  privateKey: string;
};

export type SheetParseResult = {
  data: TrainingSession[];
  headerRow: string[];
  valueRowCount: number;
};

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    next: {
      revalidate: 300
    }
  });

  if (!response.ok) {
    throw new Error(`Google Sheets request failed with ${response.status}`);
  }

  return (await response.json()) as T;
}

async function getFirstSheetTitle(sheetId: string, apiKey: string) {
  const metadataUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?fields=sheets.properties.title&key=${apiKey}`;
  const metadata = await fetchJson<SheetMetadataResponse>(metadataUrl);
  const title = metadata.sheets?.[0]?.properties?.title;

  if (!title) {
    throw new Error("No sheet tabs were found in the Google Sheet.");
  }

  return title;
}

function normalizePrivateKey(privateKey: string) {
  return privateKey.replace(/\\n/g, "\n");
}

function unwrapQuotedValue(value: string) {
  const trimmed = value.trim();

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

export function getServiceAccountCredentialsFromEnv():
  | ServiceAccountCredentials
  | null {
  const jsonBlob = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();

  if (jsonBlob) {
    try {
      const parsed = JSON.parse(unwrapQuotedValue(jsonBlob)) as {
        client_email?: string;
        private_key?: string;
      };

      if (parsed.client_email && parsed.private_key) {
        return {
          clientEmail: parsed.client_email.trim(),
          privateKey: normalizePrivateKey(parsed.private_key)
        };
      }
    } catch {
      throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON.");
    }
  }

  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.trim();

  if (!clientEmail || !privateKey) {
    return null;
  }

  return {
    clientEmail,
    privateKey: normalizePrivateKey(privateKey)
  };
}

export async function fetchGoogleSheetData(
  sheetId: string,
  apiKey: string
): Promise<TrainingSession[]> {
  const title = await getFirstSheetTitle(sheetId, apiKey);
  const range = encodeURIComponent(`${title}!A:F`);
  const valuesUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?key=${apiKey}`;
  const payload = await fetchJson<SheetsApiResponse>(valuesUrl);
  const [headerRow, ...valueRows] = payload.values ?? [];

  if (!headerRow?.length) {
    return [];
  }

  return parseSheetValues(payload.values ?? []).data;
}

export async function fetchPrivateGoogleSheetData(
  sheetId: string,
  credentials: ServiceAccountCredentials,
  range?: string
): Promise<SheetParseResult> {
  const auth = new google.auth.JWT({
    email: credentials.clientEmail,
    key: credentials.privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"]
  });
  const sheets = google.sheets({
    version: "v4",
    auth
  });
  const effectiveRange =
    range ||
    (
      await sheets.spreadsheets.get({
        spreadsheetId: sheetId,
        fields: "sheets.properties.title"
      })
    ).data.sheets?.[0]?.properties?.title ||
    "Sheet1";
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: effectiveRange
  });
  return parseSheetValues(response.data.values ?? []);
}

export function parseSheetValues(values: string[][]): SheetParseResult {
  const [headerRow, ...valueRows] = values;

  if (!headerRow?.length) {
    return {
      data: [],
      headerRow: [],
      valueRowCount: 0
    };
  }

  const data = valueRows
    .map((row, index) => {
      const record = Object.fromEntries(
        headerRow.map((header, headerIndex) => [header, row[headerIndex] ?? ""])
      );

      return coerceTrainingSession(record, index);
    })
    .filter((row): row is TrainingSession => Boolean(row));

  return {
    data,
    headerRow,
    valueRowCount: valueRows.length
  };
}
