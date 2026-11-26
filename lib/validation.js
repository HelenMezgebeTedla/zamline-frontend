const RULES = {
  registration_number: {
    allowed: /[^0-9]/g,
    maxLength: 20,
    blockedHint: "Registration number can only contain numbers.",
    check: (value) =>
      /^[0-9]{5,20}$/.test(value)
        ? ""
        : "Registration number must be 5 to 20 numbers.",
  },
  phone_number: {
    clean: (value) => {
      const plus = value.trimStart().startsWith("+") ? "+" : "";
      return plus + value.replace(/[^0-9]/g, "");
    },
    maxLength: 16,
    blockedHint: "Phone number can only contain numbers (and + at the start).",
    check: (value) =>
      /^\+?[0-9]{7,15}$/.test(value)
        ? ""
        : "Phone number must be 7 to 15 numbers, with an optional + at the start.",
  },
  first_name: {
    allowed: /[^\p{L} '-]/gu,
    maxLength: 50,
    blockedHint: "First name can only contain letters.",
    check: (value) =>
      /^\p{L}+(?:[ '-]\p{L}+)*$/u.test(value.trim())
        ? ""
        : "First name can only contain letters, spaces, hyphens and apostrophes.",
  },
  last_name: {
    allowed: /[^\p{L} '-]/gu,
    maxLength: 50,
    blockedHint: "Last name can only contain letters.",
    check: (value) =>
      /^\p{L}+(?:[ '-]\p{L}+)*$/u.test(value.trim())
        ? ""
        : "Last name can only contain letters, spaces, hyphens and apostrophes.",
  },
  business_name: {
    allowed: /[^\p{L}\p{N} &.,'()/-]/gu,
    maxLength: 255,
    blockedHint:
      "Business name can only use letters, numbers, spaces and & . , ' - ( ) /",
    check: (value) =>
      /\p{L}/u.test(value)
        ? ""
        : "Business name must contain letters, not only numbers.",
  },
  code: {
    allowed: /[^0-9]/g,
    maxLength: 6,
    blockedHint: "The code can only contain numbers.",
    check: (value) =>
      /^[0-9]{6}$/.test(value) ? "" : "Enter the 6-digit code from your email.",
  },
};

export function inputRule(name) {
  return RULES[name] || null;
}

export function clean(name, typed) {
  const rule = RULES[name];
  if (!rule) return { value: typed, blocked: false };
  let value = rule.clean ? rule.clean(typed) : typed.replace(rule.allowed, "");
  value = value.slice(0, rule.maxLength);
  return { value, blocked: value !== typed.slice(0, rule.maxLength) };
}

export function check(name, value) {
  const rule = RULES[name];
  return rule ? rule.check(value) : "";
}

export function blockedHint(name) {
  return RULES[name]?.blockedHint || "";
}

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_BYTES = 128;
const PASSWORD_RULES = [
  [/[A-Z]/, "an uppercase letter"],
  [/[a-z]/, "a lowercase letter"],
  [/[0-9]/, "a number"],
  [/[^A-Za-z0-9\s]/, "a special character such as ! @ # $ %"],
];
const COMMON_PASSWORDS = new Set([
  "password",
  "password1",
  "password123",
  "passw0rd",
  "qwerty123",
  "welcome1",
  "welcome123",
  "admin123",
  "letmein1",
  "iloveyou1",
  "12345678",
  "123456789",
  "zamline1",
  "zamline123",
]);

export function passwordProblem(password, email = "") {
  if (!password) return "Password cannot be empty.";
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  }
  if (new TextEncoder().encode(password).length > PASSWORD_MAX_BYTES) {
    return "Password is too long.";
  }
  if (password !== password.trim()) {
    return "Password must not start or end with a space.";
  }
  const missing = PASSWORD_RULES.filter(
    ([pattern]) => !pattern.test(password),
  ).map(([, label]) => label);
  if (missing.length > 0) {
    return `Password must include ${missing.join(", ")}.`;
  }
  const lower = password.toLowerCase();
  if (
    COMMON_PASSWORDS.has(lower) ||
    COMMON_PASSWORDS.has(lower.replace(/[^a-z0-9]/g, ""))
  ) {
    return "Password is too common. Choose a stronger password.";
  }
  const name = email.split("@")[0].trim().toLowerCase();
  if (name.length >= 4 && lower.includes(name)) {
    return "Password must not contain your email address.";
  }
  return "";
}
