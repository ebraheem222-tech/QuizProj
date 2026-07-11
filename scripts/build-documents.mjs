import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { marked } from "marked";
import puppeteer from "puppeteer-core";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, "..");
const docsDir = path.join(projectRoot, "docs");
const markdownPath = path.join(projectRoot, "TECHNICAL_DOCUMENT.md");
const pdfPath = path.join(docsDir, "QuizProj_TECHNICAL_DOCUMENT.pdf");
const umlSourcePath = path.join(docsDir, "UML_DIAGRAM.mmd");
const umlSvgPath = path.join(docsDir, "UML_DIAGRAM.svg");
const umlPngPath = path.join(docsDir, "UML_DIAGRAM.png");
const mermaidBundlePath = path.join(projectRoot, "node_modules", "mermaid", "dist", "mermaid.min.js");

const chromeCandidates = [
  process.env.CHROME_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser"
].filter(Boolean);

async function findChrome() {
  for (const candidate of chromeCandidates) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // Continue until a Chrome installation is found.
    }
  }

  throw new Error("Chrome was not found. Set CHROME_PATH and run npm run docs again.");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function createRenderer() {
  const renderer = new marked.Renderer();

  renderer.code = ({ text, lang = "" }) => {
    if (lang.trim().toLowerCase() === "mermaid") {
      return `<figure class="diagram"><div class="mermaid">${escapeHtml(text)}</div></figure>`;
    }

    const safeLanguage = lang.replace(/[^a-z0-9_-]/gi, "");
    const languageClass = safeLanguage ? ` class="language-${safeLanguage}"` : "";
    return `<pre dir="ltr"><code${languageClass}>${escapeHtml(text)}</code></pre>`;
  };

  return renderer;
}

function createTechnicalDocumentHtml(markdown) {
  const content = marked.parse(markdown, { renderer: createRenderer() });

  return `<!doctype html>
<html lang="he" dir="rtl">
<head>
  <meta charset="utf-8">
  <title>מסמך טכני - QuizProj</title>
  <style>
    @page { size: A4; margin: 14mm 13mm 16mm; }
    * { box-sizing: border-box; }
    html { background: #fff; }
    body {
      margin: 0;
      color: #172033;
      background: #fff;
      font-family: Arial, "Segoe UI", sans-serif;
      font-size: 10.5pt;
      line-height: 1.55;
      direction: rtl;
    }
    main { width: 100%; }
    h1, h2, h3 { color: #12355b; page-break-after: avoid; }
    h1 {
      margin: 0 0 20px;
      padding: 18px 0 14px;
      border-bottom: 4px solid #1f6f8b;
      font-size: 27pt;
      text-align: center;
    }
    h2 {
      margin: 24px 0 10px;
      padding: 7px 10px;
      border-right: 5px solid #1f6f8b;
      background: #eef6f8;
      font-size: 17pt;
    }
    h3 { margin: 18px 0 7px; font-size: 13pt; }
    p { margin: 7px 0; }
    a { color: #0b5f75; text-decoration: none; }
    ul { margin: 7px 0; padding-right: 22px; }
    li { margin: 3px 0; }
    hr { margin: 22px 0; border: 0; border-top: 1px solid #b9c8d2; }
    table {
      width: 100%;
      margin: 10px 0 16px;
      border-collapse: collapse;
      font-size: 8.6pt;
      page-break-inside: avoid;
    }
    th, td { padding: 6px 7px; border: 1px solid #aebdca; text-align: right; vertical-align: top; }
    th { color: #fff; background: #24536d; }
    tr:nth-child(even) td { background: #f6f9fb; }
    code { font-family: Consolas, "Courier New", monospace; direction: ltr; unicode-bidi: embed; }
    :not(pre) > code { padding: 1px 4px; border: 1px solid #d5dee5; background: #f4f6f8; border-radius: 3px; }
    pre {
      max-width: 100%;
      margin: 10px 0 14px;
      padding: 10px 12px;
      overflow-wrap: anywhere;
      white-space: pre-wrap;
      border: 1px solid #ccd7df;
      border-radius: 4px;
      color: #18222c;
      background: #f7f9fa;
      font-size: 8.2pt;
      line-height: 1.42;
      page-break-inside: avoid;
    }
    figure.diagram {
      margin: 12px 0 18px;
      padding: 8px;
      direction: ltr;
      text-align: center;
      page-break-inside: avoid;
    }
    .diagram svg { display: block; width: 100% !important; max-width: 100% !important; height: auto !important; margin: 0 auto; }
    .diagram .label, .diagram text, .diagram foreignObject { font-family: Arial, "Segoe UI", sans-serif !important; }
  </style>
</head>
<body>
  <main>${content}</main>
</body>
</html>`;
}

function createUmlHtml(source) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <style>
    * { box-sizing: border-box; }
    html, body { margin: 0; background: #fff; }
    body { padding: 28px; font-family: Arial, "Segoe UI", sans-serif; }
    .diagram-frame {
      display: inline-block;
      min-width: 1500px;
      padding: 28px;
      border: 2px solid #9db2c1;
      background: #fff;
    }
    h1 { margin: 0 0 18px; color: #12355b; font-size: 32px; text-align: center; }
    .mermaid { direction: ltr; }
    .mermaid svg { display: block; max-width: none !important; height: auto; margin: 0 auto; }
  </style>
</head>
<body>
  <section class="diagram-frame">
    <h1>QuizProj - OOP UML Class Diagram</h1>
    <div class="mermaid">${escapeHtml(source)}</div>
  </section>
</body>
</html>`;
}

async function renderMermaid(page) {
  await page.addScriptTag({ path: mermaidBundlePath });
  await page.evaluate(async () => {
    window.mermaid.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      theme: "base",
      themeVariables: {
        fontFamily: 'Arial, "Segoe UI", sans-serif',
        primaryColor: "#eef6f8",
        primaryTextColor: "#172033",
        primaryBorderColor: "#24536d",
        lineColor: "#466779",
        secondaryColor: "#f6f9fb",
        tertiaryColor: "#ffffff",
        actorBkg: "#eef6f8",
        actorBorder: "#24536d",
        actorTextColor: "#172033",
        signalColor: "#24536d",
        signalTextColor: "#172033"
      },
      flowchart: { htmlLabels: true, useMaxWidth: true },
      sequence: { useMaxWidth: true, wrap: true },
      class: {
        useMaxWidth: true,
        nodeSpacing: 90,
        rankSpacing: 110,
        diagramPadding: 30
      }
    });

    await window.mermaid.run({ querySelector: ".mermaid" });
  });
}

async function buildTechnicalPdf(browser, markdown) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });
  await page.setContent(createTechnicalDocumentHtml(markdown), { waitUntil: "domcontentloaded" });
  await renderMermaid(page);
  await page.emulateMediaType("print");
  await page.pdf({
    path: pdfPath,
    format: "A4",
    printBackground: true,
    preferCSSPageSize: true,
    displayHeaderFooter: true,
    headerTemplate: "<span></span>",
    footerTemplate: '<div style="width:100%;padding:0 13mm;color:#667784;font:8px Arial;text-align:center"><span class="pageNumber"></span> / <span class="totalPages"></span></div>'
  });
  await page.close();
}

async function buildUmlAssets(browser, source) {
  const page = await browser.newPage();
  await page.setViewport({ width: 2200, height: 1800, deviceScaleFactor: 2 });
  await page.setContent(createUmlHtml(source), { waitUntil: "domcontentloaded" });
  await renderMermaid(page);

  const svg = await page.$eval(".mermaid svg", element => {
    const clone = element.cloneNode(true);
    const viewBox = element.viewBox.baseVal;
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    clone.setAttribute("width", String(Math.ceil(viewBox.width)));
    clone.setAttribute("height", String(Math.ceil(viewBox.height)));
    clone.removeAttribute("style");
    return `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(clone)}`;
  });
  await writeFile(umlSvgPath, svg, "utf8");

  const frame = await page.$(".diagram-frame");
  await frame.screenshot({ path: umlPngPath, type: "png" });
  await page.close();
}

async function main() {
  const umlOnly = process.argv.includes("--uml-only");
  await mkdir(docsDir, { recursive: true });
  const [markdown, umlSource, executablePath] = await Promise.all([
    readFile(markdownPath, "utf8"),
    readFile(umlSourcePath, "utf8"),
    findChrome()
  ]);

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--font-render-hinting=none"]
  });

  try {
    if (!umlOnly) {
      await buildTechnicalPdf(browser, markdown);
    }
    await buildUmlAssets(browser, umlSource);
  } finally {
    await browser.close();
  }

  if (!umlOnly) {
    console.log(`Created ${path.relative(projectRoot, pdfPath)}`);
  }
  console.log(`Created ${path.relative(projectRoot, umlSvgPath)}`);
  console.log(`Created ${path.relative(projectRoot, umlPngPath)}`);
}

await main();
