import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { writeFile } from "node:fs/promises";

const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome-stable",
  headless: true,
  args: [
    "--no-sandbox",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
  ],
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 1050 },
});
const page = await context.newPage();
await page.goto(process.env.TEST_URL || "http://127.0.0.1:5174");
await page.waitForLoadState("networkidle");
const reports = [];
for (const width of [1440, 390]) {
  await page.setViewportSize({ width, height: 1050 });
  for (const name of [
    "Peta kompetensi",
    "Asesmen mandiri",
    "Hasil & rekomendasi",
    "Dasar penilaian",
  ]) {
    if (width < 761)
      await page
        .getByRole("button", { name: "Buka navigasi", exact: true })
        .click();
    await page
      .locator("nav")
      .getByRole("button", { name, exact: true })
      .click();
    await page.waitForTimeout(250);
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    const violations = result.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      description: v.description,
      nodes: v.nodes.map((n) => ({
        target: n.target,
        summary: n.failureSummary,
      })),
    }));
    reports.push({ page: name, width, violations });
    console.log(JSON.stringify(reports.at(-1)));
  }
}
await writeFile(
  "docs/accessibility-results.json",
  JSON.stringify(reports, null, 2),
);
await browser.close();
if (reports.some((r) => r.violations.length)) process.exitCode = 1;
