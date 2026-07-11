import { initializePage } from "../ui/layout.js";
import { pathFor } from "../utils/router.js";

const { currentUser } = initializePage({ activeRoute: "home" });
const actions = document.getElementById("homeActions");

if (currentUser) {
  const dashboardRoute = currentUser.getDashboardRoute();
  const dashboardLabel = currentUser.isTeacher() ? "מעבר לאזור המורה" : "מעבר לאזור הסטודנט";

  actions.innerHTML = `
    <a class="btn btn-primary" href="${pathFor(dashboardRoute)}">${dashboardLabel}</a>
  `;
} else {
  actions.innerHTML = `
    <a class="btn btn-primary" href="${pathFor("register")}">הרשמה</a>
    <a class="btn btn-outline-primary" href="${pathFor("login")}">התחברות</a>
  `;
}
