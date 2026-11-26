import { expect, test } from "@playwright/test";
import { PORTALS, mockApi } from "./helpers";

const EMAIL = "owner@lusakafreight.com";

async function fillSignup(page, password) {
  const values = {
    business_name: "Lusaka Freight Ltd",
    registration_number: "120180010448",
    company_email: EMAIL,
    phone_number: "+260971234567",
    first_name: "Mary",
    last_name: "Banda",
    password,
    confirm_password: password,
  };
  for (const [field, value] of Object.entries(values)) {
    await page.locator(`#${field}`).fill(value);
  }
}

const WEAK_PASSWORDS = [
  ["Short1!", "Password must be at least 8 characters."],
  ["nouppercase1!", "Password must include an uppercase letter."],
  [
    "NoSpecial123",
    "Password must include a special character such as ! @ # $ %.",
  ],
  ["Password1!", "Password is too common. Choose a stronger password."],
  ["Owner2026!x", "Password must not contain your email address."],
];

for (const portal of PORTALS) {
  test.describe(`${portal.label} password rules`, () => {
    for (const [password, message] of WEAK_PASSWORDS) {
      test(`sign-up refuses ${password}`, async ({ page }) => {
        const calls = await mockApi(page);
        await page.goto(`${portal.path}/signup`);
        await fillSignup(page, password);
        await page.getByRole("button", { name: "Create Account" }).click();
        await expect(page.locator(".auth-signup-error")).toHaveText(message);
        expect(calls.some((call) => call.key === "POST /users/register")).toBe(
          false,
        );
      });
    }

    test("sign-up accepts a strong password", async ({ page }) => {
      await page.goto(`${portal.path}/signup`);
      await fillSignup(page, "Kafue#River2026");
      await page.getByRole("button", { name: "Create Account" }).click();
      await expect(page.locator(".auth-signup-error")).toHaveText(
        "Please upload your PACRA certificate.",
      );
    });

    test("reset refuses a weak new password", async ({ page }) => {
      const calls = await mockApi(page, {
        "POST /users/forgot-password": () => ({ json: { message: "Sent" } }),
      });
      await page.goto(`${portal.path}/forgot-password`);
      await page.locator("#email").fill(EMAIL);
      await page.getByRole("button", { name: "Send reset code" }).click();
      await page.locator("#code").fill("123456");
      await page.locator("#new-password").fill("weakpassword");
      await page.locator("#confirm-password").fill("weakpassword");
      await page.getByRole("button", { name: "Reset password" }).click();
      await expect(page.locator(".auth-login-error")).toHaveText(
        "Password must include an uppercase letter, a number, a special character such as ! @ # $ %.",
      );
      expect(
        calls.some((call) => call.key === "POST /users/reset-password"),
      ).toBe(false);
    });

    test("reset sends a strong new password", async ({ page }) => {
      const calls = await mockApi(page, {
        "POST /users/forgot-password": () => ({ json: { message: "Sent" } }),
        "POST /users/reset-password": () => ({
          json: { message: "Your password has been reset." },
        }),
      });
      await page.goto(`${portal.path}/forgot-password`);
      await page.locator("#email").fill(EMAIL);
      await page.getByRole("button", { name: "Send reset code" }).click();
      await page.locator("#code").fill("123456");
      await page.locator("#new-password").fill("Kafue#River2026");
      await page.locator("#confirm-password").fill("Kafue#River2026");
      await page.getByRole("button", { name: "Reset password" }).click();
      await expect(
        page.getByRole("heading", { name: "Password changed" }),
      ).toBeVisible();
      const reset = calls.find(
        (call) => call.key === "POST /users/reset-password",
      );
      expect(reset.body.new_password).toBe("Kafue#River2026");
    });
  });
}
