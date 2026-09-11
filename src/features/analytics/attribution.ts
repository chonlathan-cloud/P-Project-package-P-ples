import { readPrivacyConsent } from "./consent";

export const ATTRIBUTION_STORAGE_KEY = "ddbox_attribution_v1";
export const ATTRIBUTION_SCHEMA_VERSION = 1 as const;
export const ATTRIBUTION_MODEL = "first_last_tagged" as const;
export const ATTRIBUTION_TTL_DAYS = 90;
export const ATTRIBUTION_TTL_MS = ATTRIBUTION_TTL_DAYS * 24 * 60 * 60 * 1_000;

export type AttributionTouch = Readonly<{
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_id: string | null;
  utm_content: string | null;
  utm_term: string | null;
  adgroup_id: string | null;
  gclid: string | null;
  landing_path: string;
  captured_at: string;
  expires_at: string;
}>;

export type LeadAttribution = Readonly<{
  schema_version: typeof ATTRIBUTION_SCHEMA_VERSION;
  model: typeof ATTRIBUTION_MODEL;
  first_touch: AttributionTouch | null;
  last_touch: AttributionTouch | null;
}>;

const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f-\u009f]/u;
const CONTROLLED_TOKEN = /^[A-Za-z0-9][A-Za-z0-9._~-]*$/u;
const NUMERIC_ID = /^\d+$/u;
const UNRESOLVED_VALUE_TRACK = /\{[^{}]+\}/u;
const EMAIL_LIKE_VALUE = /[^\s@]+@[^\s@]+\.[^\s@]+/u;
const ISO_WITH_TIMEZONE =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/u;

const TOUCH_IDENTITY_FIELDS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_id",
  "utm_content",
  "utm_term",
  "adgroup_id",
  "gclid",
  "landing_path",
] as const satisfies readonly (keyof AttributionTouch)[];

let inMemoryAttribution: LeadAttribution | null = null;
let usesInMemoryFallback = false;

function characterLength(value: string): number {
  return Array.from(value).length;
}

function hasLikelyPersonalData(value: string): boolean {
  if (EMAIL_LIKE_VALUE.test(value)) return true;
  const digitCount = value.match(/\d/gu)?.length ?? 0;
  return digitCount >= 8 && digitCount <= 15 && /^[+()\d.\-\s]+$/u.test(value);
}

function validTextValue(
  value: string,
  maximumLength: number,
  options: Readonly<{
    controlledToken?: boolean;
    rejectLikelyPii?: boolean;
  }> = {},
): boolean {
  if (
    value.length === 0 ||
    value !== value.trim() ||
    characterLength(value) > maximumLength ||
    CONTROL_CHARACTERS.test(value) ||
    UNRESOLVED_VALUE_TRACK.test(value)
  )
    return false;
  if (options.controlledToken && !CONTROLLED_TOKEN.test(value)) return false;
  if (options.rejectLikelyPii && hasLikelyPersonalData(value)) return false;
  return true;
}

function validNumericId(value: string): boolean {
  return (
    validTextValue(value, 100) &&
    NUMERIC_ID.test(value) &&
    !UNRESOLVED_VALUE_TRACK.test(value)
  );
}

function validCampaignContent(value: string): boolean {
  return (
    validTextValue(value, 200) &&
    (NUMERIC_ID.test(value) || !hasLikelyPersonalData(value))
  );
}

function validGclid(value: string): boolean {
  return (
    value.length > 0 &&
    new TextEncoder().encode(value).byteLength <= 512 &&
    !/[\s\p{Z}]/u.test(value) &&
    !CONTROL_CHARACTERS.test(value) &&
    !UNRESOLVED_VALUE_TRACK.test(value)
  );
}

function uniqueQueryValue(
  parameters: URLSearchParams,
  key: string,
  validator: (value: string) => boolean,
): string | null {
  const values = parameters.getAll(key);
  if (values.length !== 1 || !validator(values[0])) return null;
  return values[0];
}

function parseUrl(input: string | URL): URL | null {
  try {
    const base =
      typeof window === "undefined"
        ? "https://ddbox.invalid"
        : window.location.origin;
    const url =
      input instanceof URL ? new URL(input.href) : new URL(input, base);
    return url.protocol === "http:" || url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

function validLandingPath(value: string): boolean {
  return (
    value.startsWith("/") &&
    characterLength(value) <= 2_048 &&
    !value.includes("?") &&
    !value.includes("#") &&
    !CONTROL_CHARACTERS.test(value)
  );
}

function epochMilliseconds(value: Date): number | null {
  const milliseconds = value.getTime();
  return Number.isFinite(milliseconds) ? milliseconds : null;
}

function parseTimestamp(value: unknown): number | null {
  if (typeof value !== "string" || !ISO_WITH_TIMEZONE.test(value)) return null;
  const milliseconds = Date.parse(value);
  return Number.isFinite(milliseconds) ? milliseconds : null;
}

function nullableStoredValue(
  value: unknown,
  validator: (candidate: string) => boolean,
): string | null | undefined {
  if (value === null) return null;
  if (typeof value !== "string" || !validator(value)) return undefined;
  return value;
}

function freezeTouch(touch: AttributionTouch): AttributionTouch {
  return Object.freeze(touch);
}

function createAttribution(
  firstTouch: AttributionTouch,
  lastTouch: AttributionTouch,
): LeadAttribution {
  return Object.freeze({
    schema_version: ATTRIBUTION_SCHEMA_VERSION,
    model: ATTRIBUTION_MODEL,
    first_touch: freezeTouch({ ...firstTouch }),
    last_touch: freezeTouch({ ...lastTouch }),
  });
}

function storedTouch(value: unknown): AttributionTouch | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Record<string, unknown>;

  const utmSource = nullableStoredValue(candidate.utm_source, (item) =>
    validTextValue(item, 100, {
      controlledToken: true,
      rejectLikelyPii: true,
    }),
  );
  const utmMedium = nullableStoredValue(candidate.utm_medium, (item) =>
    validTextValue(item, 100, {
      controlledToken: true,
      rejectLikelyPii: true,
    }),
  );
  const utmCampaign = nullableStoredValue(candidate.utm_campaign, (item) =>
    validTextValue(item, 200, { rejectLikelyPii: true }),
  );
  const utmId = nullableStoredValue(candidate.utm_id, validNumericId);
  const utmContent = nullableStoredValue(
    candidate.utm_content,
    validCampaignContent,
  );
  const utmTerm = nullableStoredValue(candidate.utm_term, (item) =>
    validTextValue(item, 300, { rejectLikelyPii: true }),
  );
  const adgroupId = nullableStoredValue(candidate.adgroup_id, validNumericId);
  const gclid = nullableStoredValue(candidate.gclid, validGclid);

  if (
    utmSource === undefined ||
    utmMedium === undefined ||
    utmCampaign === undefined ||
    utmId === undefined ||
    utmContent === undefined ||
    utmTerm === undefined ||
    adgroupId === undefined ||
    gclid === undefined ||
    typeof candidate.landing_path !== "string" ||
    !validLandingPath(candidate.landing_path)
  )
    return null;

  const capturedAt = parseTimestamp(candidate.captured_at);
  const expiresAt = parseTimestamp(candidate.expires_at);
  if (
    capturedAt === null ||
    expiresAt === null ||
    expiresAt <= capturedAt ||
    expiresAt - capturedAt > ATTRIBUTION_TTL_MS
  )
    return null;

  if (!(utmSource !== null && utmMedium !== null) && gclid === null)
    return null;

  return freezeTouch({
    utm_source: utmSource,
    utm_medium: utmMedium,
    utm_campaign: utmCampaign,
    utm_id: utmId,
    utm_content: utmContent,
    utm_term: utmTerm,
    adgroup_id: adgroupId,
    gclid,
    landing_path: candidate.landing_path,
    captured_at: new Date(capturedAt).toISOString(),
    expires_at: new Date(expiresAt).toISOString(),
  });
}

function normalizedStoredAttribution(
  value: unknown,
  nowMilliseconds: number,
): LeadAttribution | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Record<string, unknown>;
  if (
    candidate.schema_version !== ATTRIBUTION_SCHEMA_VERSION ||
    candidate.model !== ATTRIBUTION_MODEL
  )
    return null;

  const firstTouch = storedTouch(candidate.first_touch);
  const lastTouch = storedTouch(candidate.last_touch);
  if (!firstTouch || !lastTouch) return null;

  const firstCapturedAt = Date.parse(firstTouch.captured_at);
  const lastCapturedAt = Date.parse(lastTouch.captured_at);
  if (firstCapturedAt > lastCapturedAt) return null;

  const activeFirst =
    Date.parse(firstTouch.expires_at) > nowMilliseconds ? firstTouch : null;
  const activeLast =
    Date.parse(lastTouch.expires_at) > nowMilliseconds ? lastTouch : null;
  if (!activeFirst && !activeLast) return null;

  const retainedFirst = activeFirst ?? activeLast;
  const retainedLast = activeLast ?? activeFirst;
  if (!retainedFirst || !retainedLast) return null;
  return createAttribution(retainedFirst, retainedLast);
}

function storeAttribution(attribution: LeadAttribution): LeadAttribution {
  inMemoryAttribution = attribution;
  try {
    window.localStorage.setItem(
      ATTRIBUTION_STORAGE_KEY,
      JSON.stringify(attribution),
    );
    usesInMemoryFallback = false;
  } catch {
    usesInMemoryFallback = true;
  }
  return attribution;
}

function removeStoredAttribution(): void {
  try {
    window.localStorage.removeItem(ATTRIBUTION_STORAGE_KEY);
  } catch {
    // The in-memory copy is still cleared by the caller.
  }
}

function readInMemoryFallback(nowMilliseconds: number): LeadAttribution | null {
  if (!usesInMemoryFallback) return null;
  const attribution = normalizedStoredAttribution(
    inMemoryAttribution,
    nowMilliseconds,
  );
  if (!attribution) {
    inMemoryAttribution = null;
    usesInMemoryFallback = false;
    return null;
  }
  inMemoryAttribution = attribution;
  return attribution;
}

function sameObservedTouch(
  existing: AttributionTouch,
  candidate: AttributionTouch,
): boolean {
  if (existing.gclid !== null && candidate.gclid !== null)
    return existing.gclid === candidate.gclid;
  return TOUCH_IDENTITY_FIELDS.every(
    (field) => existing[field] === candidate[field],
  );
}

export function parseAttributionTouch(
  input: string | URL,
  now = new Date(),
): AttributionTouch | null {
  const nowMilliseconds = epochMilliseconds(now);
  const url = parseUrl(input);
  if (nowMilliseconds === null || !url || !validLandingPath(url.pathname))
    return null;

  const parameters = url.searchParams;
  const utmSource = uniqueQueryValue(parameters, "utm_source", (value) =>
    validTextValue(value, 100, {
      controlledToken: true,
      rejectLikelyPii: true,
    }),
  );
  const utmMedium = uniqueQueryValue(parameters, "utm_medium", (value) =>
    validTextValue(value, 100, {
      controlledToken: true,
      rejectLikelyPii: true,
    }),
  );
  const utmCampaign = uniqueQueryValue(parameters, "utm_campaign", (value) =>
    validTextValue(value, 200, { rejectLikelyPii: true }),
  );
  const utmId = uniqueQueryValue(parameters, "utm_id", validNumericId);
  const utmContent = uniqueQueryValue(
    parameters,
    "utm_content",
    validCampaignContent,
  );
  const utmTerm = uniqueQueryValue(parameters, "utm_term", (value) =>
    validTextValue(value, 300, { rejectLikelyPii: true }),
  );
  const adgroupId = uniqueQueryValue(parameters, "adgroup_id", validNumericId);
  const gclid = uniqueQueryValue(parameters, "gclid", validGclid);

  if (!(utmSource !== null && utmMedium !== null) && gclid === null)
    return null;

  return freezeTouch({
    utm_source: utmSource,
    utm_medium: utmMedium,
    utm_campaign: utmCampaign,
    utm_id: utmId,
    utm_content: utmContent,
    utm_term: utmTerm,
    adgroup_id: adgroupId,
    gclid,
    landing_path: url.pathname,
    captured_at: new Date(nowMilliseconds).toISOString(),
    expires_at: new Date(nowMilliseconds + ATTRIBUTION_TTL_MS).toISOString(),
  });
}

export function readAttribution(now = new Date()): LeadAttribution | null {
  if (typeof window === "undefined") return null;
  const nowMilliseconds = epochMilliseconds(now);
  if (nowMilliseconds === null) return null;

  let raw: string | null;
  try {
    raw = window.localStorage.getItem(ATTRIBUTION_STORAGE_KEY);
  } catch {
    return readInMemoryFallback(nowMilliseconds);
  }

  if (raw === null) return readInMemoryFallback(nowMilliseconds);

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    inMemoryAttribution = null;
    usesInMemoryFallback = false;
    removeStoredAttribution();
    return null;
  }

  const attribution = normalizedStoredAttribution(parsed, nowMilliseconds);
  if (!attribution) {
    inMemoryAttribution = null;
    usesInMemoryFallback = false;
    removeStoredAttribution();
    return null;
  }

  inMemoryAttribution = attribution;
  usesInMemoryFallback = false;
  const normalized = JSON.stringify(attribution);
  if (normalized !== raw) storeAttribution(attribution);
  return attribution;
}

export function captureAttributionIfAllowed(
  input?: string | URL,
  now = new Date(),
): LeadAttribution | null {
  if (typeof window === "undefined") return null;
  if (readPrivacyConsent()?.mode !== "all") return null;

  const current = readAttribution(now);
  const touch = parseAttributionTouch(input ?? window.location.href, now);
  if (!touch) return current;
  if (current?.last_touch && sameObservedTouch(current.last_touch, touch))
    return current;
  if (
    current?.last_touch &&
    Date.parse(touch.captured_at) < Date.parse(current.last_touch.captured_at)
  )
    return current;

  return storeAttribution(
    current?.first_touch
      ? createAttribution(current.first_touch, touch)
      : createAttribution(touch, touch),
  );
}

export function getAttributionForLead(
  now = new Date(),
): LeadAttribution | null {
  if (typeof window === "undefined") return null;
  if (readPrivacyConsent()?.mode !== "all") return null;
  return readAttribution(now);
}

export function clearAttribution(): void {
  inMemoryAttribution = null;
  usesInMemoryFallback = false;
  if (typeof window === "undefined") return;
  removeStoredAttribution();
}
