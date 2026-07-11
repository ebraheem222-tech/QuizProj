import { access } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

import puppeteer from "puppeteer-core";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, "..");
const port = Number(process.env.FLOW_TEST_PORT || 34177);
const baseUrl = `http://127.0.0.1:${port}`;

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
      // Try the next common Chrome location.
    }
  }

  throw new Error("Chrome was not found. Set CHROME_PATH before running npm run test:flows.");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function delay(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

async function waitForServer(server) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (server.exitCode !== null) {
      throw new Error(`Express server exited with code ${server.exitCode}.`);
    }

    try {
      const response = await fetch(baseUrl);

      if (response.ok) {
        return;
      }
    } catch {
      // The server may still be starting.
    }

    await delay(100);
  }

  throw new Error(`Express server did not start at ${baseUrl}.`);
}

async function setInput(page, selector, value) {
  await page.waitForSelector(selector);
  await page.$eval(selector, element => {
    element.value = "";
  });
  await page.type(selector, value);
}

async function waitForPath(page, pathname) {
  await page.waitForFunction(
    expectedPath => window.location.pathname === expectedPath,
    { timeout: 7000 },
    pathname
  );
}

async function waitForText(page, selector, expectedText) {
  await page.waitForFunction(
    (targetSelector, text) => document.querySelector(targetSelector)?.textContent.includes(text),
    { timeout: 7000 },
    selector,
    expectedText
  );
}

async function register(page, user) {
  await page.goto(`${baseUrl}/register`, { waitUntil: "domcontentloaded" });
  await setInput(page, '[name="fullName"]', user.fullName);
  await setInput(page, '[name="nationalId"]', user.nationalId);
  await setInput(page, '[name="email"]', user.email);
  await setInput(page, '[name="password"]', user.password);
  await page.select('[name="role"]', user.role);
  await page.click('#registerForm button[type="submit"]');
  await waitForPath(page, user.role === "teacher" ? "/teacher" : "/student");
}

async function login(page, identifier, password) {
  await page.goto(`${baseUrl}/login`, { waitUntil: "domcontentloaded" });
  await setInput(page, '[name="identifier"]', identifier);
  await setInput(page, '[name="password"]', password);
  await page.click('#loginForm button[type="submit"]');
}

async function getExamDetailsHref(page, examTitle) {
  return page.$$eval("#teacherExamList article", (articles, title) => {
    const article = articles.find(item => item.textContent.includes(title));
    return article?.querySelector('a[href*="/exam/"]')?.href || "";
  }, examTitle);
}

async function main() {
  const executablePath = await findChrome();
  const server = spawn(process.execPath, ["server.js"], {
    cwd: projectRoot,
    env: { ...process.env, PORT: String(port) },
    stdio: "ignore",
    windowsHide: true
  });

  let browser;

  try {
    await waitForServer(server);
    browser = await puppeteer.launch({
      executablePath,
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--ignore-certificate-errors"]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 1000 });

    const teacher = {
      fullName: "Flow Test Teacher",
      nationalId: "900000001",
      email: "flow.teacher@example.com",
      password: "1234",
      role: "teacher"
    };
    const student = {
      fullName: "Flow Test Student",
      nationalId: "900000002",
      email: "flow.student@example.com",
      password: "1234",
      role: "student"
    };
    const examTitle = "Flow Verification Exam";
    const questionText = "Which answer is correct?";

    await register(page, teacher);
    console.log("PASS registration routes a teacher to /teacher");

    await page.waitForSelector('#examForm [name="title"]');
    await setInput(page, '#examForm [name="title"]', examTitle);
    await setInput(page, '#examForm [name="category"]', "Flow Testing");
    await setInput(page, '#examForm [name="code"]', "FLOW-CHECK");
    await setInput(page, '#examForm [name="durationMinutes"]', "0");
    await setInput(page, '#examForm [name="description"]', "Automated flow verification exam");
    await page.click('#examForm button[type="submit"]');
    await waitForText(page, "#teacherExamList", examTitle);
    assert(new URL(page.url()).pathname === "/teacher", "Exam creation redirected unexpectedly.");
    console.log("PASS exam creation refreshes the list without redirecting");

    const detailsHref = await getExamDetailsHref(page, examTitle);
    assert(detailsHref, "The created exam management link was not found.");
    await page.goto(detailsHref, { waitUntil: "domcontentloaded" });
    await waitForText(page, "#examDetailsTitle", examTitle);
    await setInput(page, '#questionForm [name="text"]', questionText);
    await setInput(page, '#questionForm [name="answer0"]', "Correct answer");
    await setInput(page, '#questionForm [name="answer1"]', "Wrong answer 1");
    await setInput(page, '#questionForm [name="answer2"]', "Wrong answer 2");
    await setInput(page, '#questionForm [name="answer3"]', "Wrong answer 3");
    await page.select('#questionForm [name="correctAnswerIndex"]', "0");
    await page.click('#questionForm button[type="submit"]');
    await waitForText(page, "#questionsList", questionText);
    console.log("PASS teacher ownership and question saving flow");

    await page.click("#logoutButton");
    await waitForPath(page, "/");
    await register(page, student);
    console.log("PASS registration routes a student to /student");

    await page.goto(`${baseUrl}/teacher`, { waitUntil: "domcontentloaded" });
    await waitForPath(page, "/student");
    console.log("PASS role guard redirects a student away from /teacher");

    await page.goto(`${baseUrl}/search`, { waitUntil: "domcontentloaded" });
    await setInput(page, '#searchForm [name="query"]', examTitle);
    await page.$eval('#searchForm [name="query"]', element => {
      element.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await waitForText(page, "#searchResults", examTitle);
    const takeHref = await page.$eval('#searchResults a[href*="/take/"]', link => link.href);
    await page.goto(takeHref, { waitUntil: "domcontentloaded" });
    await waitForText(page, "#takeExamForm", questionText);
    await page.click('#takeExamForm input[type="radio"][value="0"]');
    await page.click('#takeExamForm button[type="submit"]');
    await waitForText(page, "#examResultBox", "100%");
    console.log("PASS search, exam submission, scoring, and immediate result flow");

    await page.click('#examResultBox a[href="/student"]');
    await waitForPath(page, "/student");
    await waitForText(page, "#studentHistory", examTitle);
    await waitForText(page, "#studentHistory", "100%");
    console.log("PASS student history and average flow");

    await page.click("#logoutButton");
    await waitForPath(page, "/");
    await login(page, teacher.email, "wrong-password");
    await waitForText(page, "#loginMessage", "פרטי ההתחברות שגויים");
    assert(new URL(page.url()).pathname === "/login", "Invalid login did not remain on /login.");
    console.log("PASS invalid login shows an error without navigation");

    await setInput(page, '[name="password"]', teacher.password);
    await page.click('#loginForm button[type="submit"]');
    await waitForPath(page, "/teacher");
    await waitForText(page, "#teacherExamList", examTitle);
    const resultDetailsHref = await getExamDetailsHref(page, examTitle);
    await page.goto(resultDetailsHref, { waitUntil: "domcontentloaded" });
    await waitForText(page, "#examResultsTable", student.fullName);
    await waitForText(page, "#examResultsTable", "100%");
    console.log("PASS teacher result lookup flow");

    await page.goto(`${baseUrl}/teacher`, { waitUntil: "domcontentloaded" });
    await waitForText(page, "#teacherExamList", examTitle);
    page.once("dialog", dialog => dialog.accept());
    await page.$$eval("#teacherExamList article", (articles, title) => {
      const article = articles.find(item => item.textContent.includes(title));
      article.querySelector('button[data-action="delete"]').click();
    }, examTitle);
    await page.waitForFunction(title => !document.querySelector("#teacherExamList")?.textContent.includes(title), {}, examTitle);
    const deletionState = await page.evaluate(title => {
      const exams = JSON.parse(localStorage.getItem("quizproj.exams") || "[]");
      const results = JSON.parse(localStorage.getItem("quizproj.results") || "[]");
      return {
        examExists: exams.some(exam => exam.title === title),
        resultExists: results.some(result => result.examTitle === title)
      };
    }, examTitle);
    assert(!deletionState.examExists, "Deleted exam remains in localStorage.");
    assert(!deletionState.resultExists, "Deleted exam results remain in localStorage.");
    console.log("PASS exam deletion also removes related results");

    console.log("All browser flow checks passed.");
  } finally {
    await browser?.close();
    server.kill();
  }
}

await main();
