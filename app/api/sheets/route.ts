import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_MODE_COOKIE_NAME,
  getDashboardModeFromCookieValue,
  isPasswordProtectionEnabled
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

function getProfileConfig(profile: DashboardProfile) {
  if (profile === "test") {
    return {
      sheetId: process.env.TEST_GOOGLE_SHEET_ID?.trim() || DEFAULT_TEST_SHEET_ID,
      range: process.env.TEST_GOOGLE_SHEET_RANGE?.trim() || undefined,
      publicSheetId: process.env.NEXT_PUBLIC_TEST_SHEET_ID?.trim(),
      apiKey: process.env.TEST_GOOGLE_API_KEY?.trim() || process.env.GOOGLE_API_KEY?.trim()
    };
  }

  return {
    sheetId: process.env.GOOGLE_SHEET_ID?.trim(),
    range: process.env.GOOGLE_SHEET_RANGE?.trim(),
    publicSheetId: process.env.NEXT_PUBLIC_SHEET_ID?.trim(),
    apiKey: process.env.GOOGLE_API_KEY?.trim()
  };
}

export async function GET(request: NextRequest) {
  try {
    const requestedProfile = request.nextUrl.searchParams.get("profile");
    const sessionProfile = getDashboardModeFromCookieValue(
      request.cookies.get(AUTH_MODE_COOKIE_NAME)?.value
    );
    const profile: DashboardProfile =
      isPasswordProtectionEnabled() && sessionProfile
        ? sessionProfile
        : requestedProfile === "test"
          ? "test"
          : "team";
    const { sheetId, range, publicSheetId, apiKey } = getProfileConfig(profile);
    const serviceAccount = getServiceAccountCredentialsFromEnv();
    const profileLabel = profile === "test" ? "test" : "team";

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
        message: result.data.length
          ? `Loaded ${profileLabel} private Google Sheet${range ? ` from ${range}` : ""}.`
          : result.valueRowCount > 0
            ? `Connected to the ${profileLabel} private Google Sheet, but none of the rows in ${
                range ?? "the selected range"
              } matched the expected columns. Found headers: ${result.headerRow.join(", ")}.`
            : `The ${profileLabel} private Google Sheet range was empty, so sample data is being shown.`
      });
    }

    if (publicSheetId && apiKey) {
      const data = await fetchGoogleSheetData(publicSheetId, apiKey);

      return NextResponse.json({
        data: data.length ? data : sampleTrainingData,
        profile,
        source: data.length ? "sheets" : "sample",
        message: data.length
          ? `Loaded ${profileLabel} data from Google Sheets.`
          : `The ${profileLabel} Google Sheet was empty, so sample data is being shown.`
      });
    }

    return NextResponse.json({
      data: sampleTrainingData,
      profile,
      source: "sample",
      message:
        `Using bundled sample data for the ${profileLabel} profile. Add private Google Sheets service-account credentials, or use the public-sheet API key fallback.`
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to load Google Sheets data.";
    const requestedProfile = request.nextUrl.searchParams.get("profile");
    const sessionProfile = getDashboardModeFromCookieValue(
      request.cookies.get(AUTH_MODE_COOKIE_NAME)?.value
    );
    const profile: DashboardProfile =
      isPasswordProtectionEnabled() && sessionProfile
        ? sessionProfile
        : requestedProfile === "test"
          ? "test"
          : "team";

    return NextResponse.json(
      {
        data: sampleTrainingData,
        profile,
        source: "sample",
        message: `${message} CSV upload remains available as a fallback.`
      },
      { status: 500 }
    );
  }
}
