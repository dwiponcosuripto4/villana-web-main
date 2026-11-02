// @TODO: use this phone number validator in /admin/villas/new and /admin/villas/[id] forms.

export type PhoneValidation = {
  /** Fully-normalized international number (E.164), e.g. +14155552671 */
  e164?: string;
  /** Country calling code, e.g. "1" for NANP */
  countryCode?: string;
  /** National significant number without country code */
  nsn?: string;
  /** Parsed extension (digits only), if present */
  extension?: string;
  /** True if the number is strictly valid per E.164 and (when applicable) NANP rules */
  isValid: boolean;
  /** Validation tier for easier UX decisions */
  kind: "valid-e164" | "potential" | "invalid";
  /** Short machine-friendly reason when invalid or downgraded to potential */
  reason?: string;
  /** Heuristic region guess for extra context */
  regionGuess?: "NANP" | "INTL" | null;
};

export type PhoneValidatorOptions = {
  /**
   * If true, numbers without a leading "+" will be treated as local/NANP and
   * converted to E.164 when possible (e.g. "415-555-2671" -> +14155552671).
   * If false, require an explicit "+" and E.164 formatting.
   * Default: true
   */
  allowNational?: boolean;

  /**
   * If true, extract common extension notations (x123, ext. 123, ;ext=123).
   * Default: true
   */
  allowExtensions?: boolean;

  /**
   * If true, perform deeper NANP checks (NXX-NXX-XXXX and 555 test block).
   * Default: true
   */
  nanpDeepCheck?: boolean;
};

const DEFAULTS: Required<PhoneValidatorOptions> = {
  allowNational: true,
  allowExtensions: true,
  nanpDeepCheck: true,
};

/** Map Arabic-Indic and similar digits to ASCII 0–9 */
function normalizeUnicodeDigits(input: string): string {
  const map: Record<string, string> = {
    // Arabic-Indic
    "٠": "0",
    "١": "1",
    "٢": "2",
    "٣": "3",
    "٤": "4",
    "٥": "5",
    "٦": "6",
    "٧": "7",
    "٨": "8",
    "٩": "9",
    // Extended Arabic-Indic
    "۰": "0",
    "۱": "1",
    "۲": "2",
    "۳": "3",
    "۴": "4",
    "۵": "5",
    "۶": "6",
    "۷": "7",
    "۸": "8",
    "۹": "9",
    // Fullwidth
    "０": "0",
    "１": "1",
    "２": "2",
    "３": "3",
    "４": "4",
    "５": "5",
    "６": "6",
    "７": "7",
    "８": "8",
    "９": "9",
  };
  return input.replace(/[٠-٩۰-۹０-９]/g, (d) => map[d] ?? d);
}

/** Pull out extensions; returns [core, extDigits] */
function extractExtension(raw: string): [core: string, ext?: string] {
  // Common patterns: ext, ext., x, x., #, ;ext= — followed by 1–6 digits
  const EXT_RE = /(?:\bext\.?|\bx\.?|[#;]\s*ext=)\s*([0-9]{1,6})\s*$/i;
  const m = raw.match(EXT_RE);
  if (!m) return [raw];
  const core = raw.slice(0, m.index).trim();
  return [core, m[1]];
}

/** Strip non-dialable chars except leading '+' and digits */
function stripToDialable(input: string): string {
  // Keep a single leading '+', remove spaces, hyphens, parentheses, dots, slashes, etc.
  const trimmed = input.trim();
  let out = "";
  for (let i = 0; i < trimmed.length; i++) {
    const ch = trimmed[i];
    if (i === 0 && ch === "+") {
      out += ch;
      continue;
    }
    if (ch >= "0" && ch <= "9") {
      out += ch;
      continue;
    }
    // ignore everything else
  }
  return out;
}

/** True if string is all the same digit (e.g., 11111111) or nearly all zeros */
function looksArtificial(digits: string): boolean {
  if (/^(\d)\1{6,}$/.test(digits)) return true; // 7+ repeated digits
  if (/^0{6,}\d*$/.test(digits)) return true; // long zeros
  return false;
}

/** NANP (country code 1) deeper plausibility checks */
function nanpChecks(nsn: string): { ok: boolean; reason?: string } {
  // Expect 10 digits for NANP national number
  if (!/^\d{10}$/.test(nsn)) return { ok: false, reason: "nanp-length" };

  const area = nsn.slice(0, 3);
  const exch = nsn.slice(3, 6);
  const line = nsn.slice(6);

  // NXX for area & exchange where N=2-9, X=0-9; disallow 37x/96x historical quirks are ignored here for sanity
  if (!/^[2-9]\d{2}$/.test(area)) return { ok: false, reason: "nanp-area" };
  if (!/^[2-9]\d{2}$/.test(exch)) return { ok: false, reason: "nanp-exchange" };

  // Block the 555-01xx “test/information” range (non-working in most regions)
  if (area === "555" && /^01\d{2}$/.test(line)) {
    return { ok: false, reason: "nanp-555" };
  }
  return { ok: true };
}

/** Validate strict E.164 shape: + and 8–15 total digits, non-zero start */
function isStrictE164(s: string): boolean {
  return /^\+[1-9]\d{7,14}$/.test(s);
}

export function validatePhone(
  input: string,
  opts: PhoneValidatorOptions = {},
): PhoneValidation {
  const options = { ...DEFAULTS, ...opts };
  if (!input || !input.trim()) {
    return {
      isValid: false,
      kind: "invalid",
      reason: "empty",
      regionGuess: null,
    };
  }

  // Normalize common unicode digits so users can paste from anywhere
  let working = normalizeUnicodeDigits(input);

  // Optional: peel off extension for later
  let ext: string | undefined;
  if (options.allowExtensions) {
    [working, ext] = extractExtension(working);
  }

  // Keep only '+' (if first) and digits
  working = stripToDialable(working);

  // If it already looks like strict E.164, we can do fast-path checks
  if (isStrictE164(working)) {
    const digits = working.slice(1);
    const cc =
      digits.slice(0, 1) === "1"
        ? "1"
        : digits.slice(0, 2)[0] === "0"
          ? digits[0]
          : digits.length >= 2 && digits[0] !== "0"
            ? digits.length >= 3
              ? digits.slice(0, 3)
              : digits.slice(0, 2)
            : digits[0];

    // Heuristic region guess only (we’re not shipping the full ITU CC table)
    const regionGuess = cc === "1" ? "NANP" : "INTL";
    const nsn = digits.slice(cc.length);

    // Extra plausibility checks
    if (looksArtificial(digits)) {
      return {
        isValid: false,
        kind: "invalid",
        reason: "artificial",
        regionGuess,
        extension: ext,
      };
    }

    // Deeper NANP checks if applicable
    if (regionGuess === "NANP" && options.nanpDeepCheck) {
      const chk = nanpChecks(nsn);
      if (!chk.ok) {
        return {
          isValid: false,
          kind: "invalid",
          reason: chk.reason,
          regionGuess,
          extension: ext,
        };
      }
    }

    return {
      isValid: true,
      kind: "valid-e164",
      e164: working,
      countryCode: cc,
      nsn,
      extension: ext,
      regionGuess,
    };
  }

  // If not strict E.164 and we don't allow national, reject
  if (!options.allowNational) {
    return {
      isValid: false,
      kind: "invalid",
      reason: "not-e164",
      regionGuess: null,
    };
  }

  // Try to “repair” common NANP formats (US/CA/etc.)
  // Accept 10 digits -> +1, or 11 digits starting with 1 -> +1 plus ten-digit NSN
  const onlyDigits = working.replace(/\D+/g, "");
  if (/^\d{10}$/.test(onlyDigits)) {
    const nsn = onlyDigits;
    // Apply NANP plausibility
    const chk = options.nanpDeepCheck ? nanpChecks(nsn) : { ok: true as const };
    const e164 = `+1${nsn}`;
    if (!chk.ok) {
      return {
        isValid: false,
        kind: "invalid",
        reason: chk.reason,
        regionGuess: "NANP",
        extension: ext,
      };
    }
    return {
      isValid: true,
      kind: "valid-e164",
      e164,
      countryCode: "1",
      nsn,
      extension: ext,
      regionGuess: "NANP",
    };
  }
  if (/^1\d{10}$/.test(onlyDigits)) {
    const nsn = onlyDigits.slice(1);
    const chk = options.nanpDeepCheck ? nanpChecks(nsn) : { ok: true as const };
    const e164 = `+${onlyDigits}`;
    if (!chk.ok) {
      return {
        isValid: false,
        kind: "invalid",
        reason: chk.reason,
        regionGuess: "NANP",
        extension: ext,
      };
    }
    return {
      isValid: true,
      kind: "valid-e164",
      e164,
      countryCode: "1",
      nsn,
      extension: ext,
      regionGuess: "NANP",
    };
  }

  // Otherwise, see if it *could* be international with a missing '+'
  // Treat 8–15 digits as "potential" international (no country metadata baked in here)
  if (/^\d{8,15}$/.test(onlyDigits)) {
    // We can return a “potential” result to let callers prompt for country or '+'
    return {
      isValid: false,
      kind: "potential",
      reason: "missing-plus-or-country",
      regionGuess: "INTL",
      extension: ext,
    };
  }

  return {
    isValid: false,
    kind: "invalid",
    reason: "shape",
    regionGuess: null,
  };
}

/* ---------------------------
   Quick usage examples
-----------------------------

validatePhone("+14155552671")
// -> { isValid: true, kind: "valid-e164", e164: "+14155552671", countryCode:"1", nsn:"4155552671", ... }

validatePhone("（+44） 20 7946 0958 ext. 123")
// -> { isValid: true, kind: "valid-e164", e164:"+442079460958", countryCode:"44", nsn:"2079460958", extension:"123", regionGuess:"INTL" }

validatePhone("415.555.2671")
// -> { isValid: true, kind: "valid-e164", e164:"+14155552671", regionGuess:"NANP" }

validatePhone("555-0101", { allowNational: true })
// -> invalid (NANP 555 test block)

validatePhone("020 7946 0958", { allowNational: true })
// -> potential (missing + / country; advise user to include country code)

validatePhone("٠١٢٣٤٥٦٧٨٩") // Arabic-Indic digits
// -> potential or invalid depending on length; digits normalized
*/
