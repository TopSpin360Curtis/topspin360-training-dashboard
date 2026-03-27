import { NextResponse } from "next/server";
import {
  fetchGoogleSheetData,
  fetchPrivateGoogleSheetData,
  getServiceAccountCredentialsFromEnv
} from "@/lib/sheetsClient";
import { sampleTrainingData } from "@/lib/sampleData";

export async function GET() {
  const privateSheetId = process.env.GOOGLE_SHEET_ID;
  const privateRange = process.env.GOOGLE_SHEET_RANGE;
  const serviceAccount = getServiceAccountCredentialsFromEnv();
  const publicSheetId = process.env.NEXT_PUBLIC_SHEET_ID;
  const apiKey = process.env.GOOGLE_API_KEY;

  try {
    if (privateSheetId && serviceAccount) {
      const result = await fetchPrivateGoogleSheetData(
        privateSheetId,
        serviceAccount,
        privateRange
      );

      return NextResponse.json({
        data: result.data.length ? result.data : sampleTrainingData,
        source: result.data.length ? "sheets" : "sample",
        message: result.data.length
          ? `Loaded private Google Sheet${privateRange ? ` from ${privateRange}` : ""}.`
          : result.valueRowCount > 0
            ? `Connected to the private Google Sheet, but none of the rows in ${
                privateRange ?? "the selected range"
              } matched the expected columns. Found headers: ${result.headerRow.join(", ")}.`
            : "The private Google Sheet range was empty, so sample data is being shown."
      });
    }

    if (publicSheetId && apiKey) {
      const data = await fetchGoogleSheetData(publicSheetId, apiKey);

      return NextResponse.json({
        data: data.length ? data : sampleTrainingData,
        source: data.length ? "sheets" : "sample",
        message: data.length
          ? "Loaded data from Google Sheets."
          : "The Google Sheet was empty, so sample data is being shown."
      });
    }

    return NextResponse.json({
      data: sampleTrainingData,
      source: "sample",
      message:
        "Using bundled sample data. Add private Google Sheets service-account credentials to .env.local, or use the public-sheet API key fallback."
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to load Google Sheets data.";

    return NextResponse.json({
      data: sampleTrainingData,
      source: "sample",
      message: `${message} CSV upload remains available as a fallback.`
    });
  }
}
