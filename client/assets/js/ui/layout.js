import { AuthService } from "../services/AuthService.js";
import { SeedService } from "../services/SeedService.js";
import { escapeHtml } from "../utils/html.js";
import { goTo, pathFor, setupNavigation } from "../utils/router.js";

const authService = new AuthService();
const seedService = new SeedService();

function applyStoredTheme() {
  const theme = localStorage.getItem("quizproj.theme") || "light";
  document.documentElement.dataset.theme = theme;
}

function toggleTheme() {
  const currentTheme = document.documentElement.dataset.theme || "light";
  const nextTheme = currentTheme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = nextTheme;
  localStorage.setItem("quizproj.theme", nextTheme);
}

function logoutAndReturnHome() {
  authService.logout();
  const homeUrl = new URL(pathFor("home"), window.location.href);

  if (window.location.pathname === homeUrl.pathname) {
    window.location.reload();
    return;
  }

  goTo("home");
}

function getRoleLinks(user) {
  if (!user) {
    return `
      <a class="btn btn-outline-primary btn-sm" data-nav="register" href="${pathFor("register")}">הרשמה</a>
      <a class="btn btn-primary btn-sm" data-nav="login" href="${pathFor("login")}">התחברות</a>
    `;
  }

  const dashboardRoute = user.getDashboardRoute();
  const dashboardLabel = user.isTeacher() ? "אזור מורה" : "אזור סטודנט";

  return `
    <a class="btn btn-outline-primary btn-sm" data-nav="${dashboardRoute}" href="${pathFor(dashboardRoute)}">${dashboardLabel}</a>
    ${user.isStudent() ? `<a class="btn btn-outline-primary btn-sm" data-nav="search" href="${pathFor("search")}">חיפוש מבחן</a>` : ""}
    <button class="btn btn-outline-danger btn-sm" id="logoutButton" type="button">התנתקות</button>
  `;
}

function trackHeaderHeight(header) {
  const updateHeaderHeight = () => {
    document.documentElement.style.setProperty("--app-header-height", `${header.offsetHeight}px`);
  };

  updateHeaderHeight();

  if ("ResizeObserver" in window) {
    new ResizeObserver(updateHeaderHeight).observe(header);
  } else {
    window.addEventListener("resize", updateHeaderHeight);
  }
}

function renderHeader(activeRoute) {
  const header = document.getElementById("appHeader");

  if (!header) {
    return;
  }

  const user = authService.getCurrentUser();

  header.className = "app-header";
  header.innerHTML = `
    <nav class="nav-shell" aria-label="ניווט ראשי">
      <a class="brand-link" data-nav="home" href="${pathFor("home")}">
        QuizProj
        <small>${user ? escapeHtml(user.fullName) : "מערכת מבחנים"}</small>
      </a>
      <div class="nav-links">
        <a class="btn ${activeRoute === "home" ? "btn-primary" : "btn-outline-primary"} btn-sm" data-nav="home" href="${pathFor("home")}">ראשי</a>
        ${getRoleLinks(user)}
        <button class="btn btn-outline-secondary btn-sm" id="themeToggle" type="button">מצב כהה</button>
      </div>
    </nav>
  `;

  setupNavigation(header);
  trackHeaderHeight(header);
  header.querySelector("#themeToggle")?.addEventListener("click", toggleTheme);
  header.querySelector("#logoutButton")?.addEventListener("click", logoutAndReturnHome);
}

export function initializePage({ activeRoute = "home", requireRole = null, guestOnly = false } = {}) {
  seedService.initialize();
  applyStoredTheme();
  renderHeader(activeRoute);
  setupNavigation();

  const currentUser = authService.getCurrentUser();

  if (guestOnly && currentUser) {
    goTo(currentUser.getDashboardRoute());
    return { authService, currentUser };
  }

  if (requireRole && !currentUser) {
    goTo("login");
    return { authService, currentUser: null };
  }

  if (requireRole && currentUser.role !== requireRole) {
    goTo(currentUser.getDashboardRoute());
    return { authService, currentUser: null };
  }

  return { authService, currentUser };
}
