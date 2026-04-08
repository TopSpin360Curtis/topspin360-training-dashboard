import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_COOKIE_NAME,
  AUTH_MODE_COOKIE_NAME,
  AUTH_TENANT_COOKIE_NAME,
  getTenantConfigById,
  validateAuthCookies
} from "@/lib/auth";
import {
  fetchGoogleSheetData,
  fetchPrivateGoogleSheetData,
  getServiceAccountCredentialsFromEnv
} from "@/lib/sheetsClient";
import { sampleTrainingData } from "@/lib/sampleData";
import type { DashboardProfile } from "@/lib/types";

export const runtime = "nodejs";

const DEFAULT_TEST_SHEET_ID = "1ZWQgwzg1trwPisVNDphVTBMw1g4Ey5ml8RQIVXt3jnQ";

export async function GET(request: NextRequest) {
  try {
    const authenticatedTenant = await validateAuthCookies({
      tenantId: request.cookies.get(AUTH_TENANT_COOKIE_NAME)?.value,
      authToken: request.cookies.get(AUTH_COOKIE_NAME)?.value,
      mode: request.cookies.get(AUTH_MODE_COOKIE_NAME)?.value
    });
    const tenantConfig = getTenantConfigById(authenticatedTenant?.id);
    const profile: DashboardProfile = tenantConfig?.profile ?? "team";
    const sheetId =
      tenantConfig?.sheetId ??
      (profile === "test"
        ? process.env.TEST_GOOGLE_SHEET_ID?.trim() || DEFAULT_TEST_SHEET_ID
        : process.env.GOOGLE_SHEET_ID?.trim());
    const range =
      tenantConfig?.range ??
      (profile === "test"
        ? process.env.TEST_GOOGLE_SHEET_RANGE?.trim() || undefined
        : process.env.GOOGLE_SHEET_RANGE?.trim());
    const publicSheetId =
      tenantConfig?.publicSheetId ??
      (profile === "test"
        ? process.env.NEXT_PUBLIC_TEST_SHEET_ID?.trim()
        : process.env.NEXT_PUBLIC_SHEET_ID?.trim());
    const apiKey =
      tenantConfig?.apiKey ??
      (profile === "test"
        ? process.env.TEST_GOOGLE_API_KEY?.trim() || process.env.GOOGLE_API_KEY?.trim()
        : process.env.GOOGLE_API_KEY?.trim());
    const serviceAccount = getServiceAccountCredentialsFromEnv();
    const profileLabel = tenantConfig?.label ?? (profile === "test" ? "test" : "team");

    if (sheetId && serviceAccount) {
      const result = await fetchPrivateGoogleSheetData(
        sheetId,
        serviceAccount,
        range
      );

      return NextResponse.json({
        data: result.data.length ? result.data : sampleTrainingData,
        profile,
        source: result.data.length ? "sheets" : "sample",
        unclaimedSessions: result.unclaimedSessions,
        message: result.data.length
          ? `Loaded ${profileLabel} Data`
          : result.valueRowCount > 0
            ? `Connected to the ${profileLabel} private Google Sheet, but none of the rows in ${
                range ?? "the selected range"
              } matched the expected columns. Found headers: ${result.headerRow.join(", ")}.`
            : `The ${profileLabel} private Google Sheet range was empty, so sample data is being shown.`
      });
    }

    if (publicSheetId && apiKey) {
      const result = await fetchGoogleSheetData(publicSheetId, apiKey);

      return NextResponse.json({
        data: result.data.length ? result.data : sampleTrainingData,
        profile,
        source: result.data.length ? "sheets" : "sample",
        unclaimedSessions: result.unclaimedSessions,
        message: result.data.length
          ? `Loaded ${profileLabel} Data`
          : `The ${profileLabel} Google Sheet was empty, so sample data is being shown.`
      });
    }

    return NextResponse.json({
      data: sampleTrainingData,
      profile,
      source: "sample",
      message:
        `Using bundled sample data for ${profileLabel}. Add private Google Sheets service-account credentials, or use the public-sheet API key fallback.`
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to load Google Sheets data.";
    const profile: DashboardProfile =
      request.cookies.get(AUTH_MODE_COOKIE_NAME)?.value === "test" ? "test" : "team";

    return NextResponse.json(
      {
        data: sampleTrainingData,
        profile,
        source: "sample",
        unclaimedSessions: 0,
        message: `${message} CSV upload remains available as a fallback.`
      },
      { status: 500 }
    );
  }
}
