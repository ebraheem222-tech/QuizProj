import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = Number(process.env.PORT || 3000);
const clientDir = path.join(__dirname, "client");

function sendClientPage(response, pagePath) {
  response.sendFile(path.join(clientDir, pagePath));
}

// Static client files: CSS, JS modules, images, and direct HTML access.
app.use(express.static(clientDir));
app.use("/client", express.static(clientDir));

// Clean page routes with Express path routing.
app.get(["/", "/index.html", "/client"], (request, response) => {
  sendClientPage(response, "index.html");
});

app.get(["/login", "/login.html"], (request, response) => {
  sendClientPage(response, "pages/login.html");
});

app.get("/register", (request, response) => {
  sendClientPage(response, "pages/register.html");
});

app.get("/teacher", (request, response) => {
  sendClientPage(response, "pages/teacher.html");
});

app.get("/student", (request, response) => {
  sendClientPage(response, "pages/student.html");
});

app.get("/search", (request, response) => {
  sendClientPage(response, "pages/search.html");
});

app.get("/exam/:id", (request, response) => {
  sendClientPage(response, "pages/exam-details.html");
});

app.get("/take/:id", (request, response) => {
  sendClientPage(response, "pages/take-exam.html");
});

app.use((request, response) => {
  response.status(404).send("Not found");
});

app.listen(port, () => {
  console.log(`QuizProj Express server is running at http://localhost:${port}`);
});
