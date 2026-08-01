import { z } from "zod";

// Denylist of passwords that trivially satisfy the rules below but are
// still guessable in the first few attempts of any real attack. Not a
// substitute for a breached-password API (out of scope for this stage),
// just a cheap floor against the most obvious choices.
const DENYLIST = new Set([
  "password",
  "password123",
  "password1234",
  "changeme123",
  "welcome123",
  "admin1234",
  "letmein123",
  "qwerty1234",
  "mltops123",
  "mltops1234",
]);

export const passwordSchema = z
  .string()
  .min(12, "Password must be at least 12 characters")
  .max(200, "Password is too long")
  .superRefine((password, ctx) => {
    if (DENYLIST.has(password.toLowerCase())) {
      ctx.addIssue({
        code: "custom",
        message: "That password is too common. Choose something less guessable.",
      });
      return;
    }
    const varietyCount = [
      /[a-z]/.test(password),
      /[A-Z]/.test(password),
      /[0-9]/.test(password),
      /[^a-zA-Z0-9]/.test(password),
    ].filter(Boolean).length;
    if (varietyCount < 3) {
      ctx.addIssue({
        code: "custom",
        message:
          "Password must include at least 3 of: lowercase, uppercase, a number, a symbol",
      });
    }
  });
