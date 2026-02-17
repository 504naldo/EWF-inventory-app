import { TRPCError } from "@trpc/server";
import { ENV } from "./env";

export type EmailPayload = {
  to: string;
  subject: string;
  body: string;
};

const SUBJECT_MAX_LENGTH = 998; // RFC 2822 recommendation
const BODY_MAX_LENGTH = 50000;

const trimValue = (value: string): string => value.trim();
const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;
const isValidEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const buildEndpointUrl = (baseUrl: string): string => {
  const normalizedBase = baseUrl.endsWith("/")
    ? baseUrl
    : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendEmail",
    normalizedBase
  ).toString();
};

const validatePayload = (input: EmailPayload): EmailPayload => {
  if (!isNonEmptyString(input.to) || !isValidEmail(input.to)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Valid recipient email address is required.",
    });
  }
  if (!isNonEmptyString(input.subject)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Email subject is required.",
    });
  }
  if (!isNonEmptyString(input.body)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Email body is required.",
    });
  }

  const to = trimValue(input.to);
  const subject = trimValue(input.subject);
  const body = trimValue(input.body);

  if (subject.length > SUBJECT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Email subject must be at most ${SUBJECT_MAX_LENGTH} characters.`,
    });
  }

  if (body.length > BODY_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Email body must be at most ${BODY_MAX_LENGTH} characters.`,
    });
  }

  return { to, subject, body };
};

/**
 * Sends an email through the Manus Email Service.
 * Returns `true` if the email was sent successfully, `false` when the upstream service
 * cannot be reached. Validation errors bubble up as TRPC errors.
 */
export async function sendEmail(
  payload: EmailPayload
): Promise<boolean> {
  const { to, subject, body } = validatePayload(payload);

  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Email service URL is not configured.",
    });
  }

  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Email service API key is not configured.",
    });
  }

  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1",
      },
      body: JSON.stringify({ to, subject, body }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Email] Failed to send email (${response.status} ${response.statusText})${
          detail ? `: ${detail}` : ""
        }`
      );
      return false;
    }

    return true;
  } catch (error) {
    console.warn("[Email] Error calling email service:", error);
    return false;
  }
}
