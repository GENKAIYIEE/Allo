import { NextResponse } from "next/server";
import dns from "node:dns/promises";
import { validateEmailFormatAndDomain } from "../../../../lib/emailValidation";

const KNOWN_VALID_MX_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.com.ph",
  "ymail.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "msn.com",
  "icloud.com",
  "me.com",
  "proton.me",
  "protonmail.com",
]);

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { email?: string };
    const rawEmail = typeof body.email === "string" ? body.email : "";

    const formatResult = validateEmailFormatAndDomain(rawEmail);
    if (!formatResult.valid) {
      return NextResponse.json(
        {
          valid: false,
          error: formatResult.error,
          suggestedEmail: formatResult.suggestedEmail,
        },
        { status: 400 }
      );
    }

    const { domain, normalizedEmail } = formatResult;

    if (!KNOWN_VALID_MX_DOMAINS.has(domain)) {
      try {
        const mxRecords = await dns.resolveMx(domain);
        const hasValidMx =
          Array.isArray(mxRecords) &&
          mxRecords.length > 0 &&
          mxRecords.some((record) => Boolean(record.exchange && record.exchange.trim() && record.exchange !== "."));

        if (!hasValidMx) {
          return NextResponse.json(
            {
              valid: false,
              error: `The email domain "@${domain}" cannot receive emails. Please check your email spelling.`,
            },
            { status: 400 }
          );
        }
      } catch (dnsError: unknown) {
        const code =
          dnsError && typeof dnsError === "object" && "code" in dnsError
            ? String((dnsError as { code?: string }).code)
            : "";

        // ENOTFOUND / ENODATA / EBADNAME means the domain does not exist or has no MX record
        if (code === "ENOTFOUND" || code === "ENODATA" || code === "EBADNAME" || code === "ESERVFAIL") {
          return NextResponse.json(
            {
              valid: false,
              error: `The email domain "@${domain}" does not exist or cannot receive emails. Please check your spelling.`,
            },
            { status: 400 }
          );
        }
      }
    }

    return NextResponse.json({
      valid: true,
      normalizedEmail,
    });
  } catch {
    return NextResponse.json(
      {
        valid: false,
        error: "Unable to validate email address right now. Please try again.",
      },
      { status: 500 }
    );
  }
}

