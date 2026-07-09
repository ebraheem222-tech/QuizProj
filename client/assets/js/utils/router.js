const routes = {
  home: { clean: "/", staticPath: "index.html" },
  login: { clean: "/login", staticPath: "pages/login.html" },
  register: { clean: "/register", staticPath: "pages/register.html" },
  teacher: { clean: "/teacher", staticPath: "pages/teacher.html" },
  student: { clean: "/student", staticPath: "pages/student.html" },
  search: { clean: "/search", staticPath: "pages/search.html" }
};

function usesNodeRoutes() {
  const pathname = window.location.pathname.replaceAll("\\", "/");
  const isStaticClientPath = pathname.includes("/client/") || pathname.endsWith(".html");

  return window.location.protocol !== "file:" && !isStaticClientPath;
}

function getClientBasePath() {
  const marker = "/client/";
  const pathname = window.location.pathname.replaceAll("\\", "/");
  const index = pathname.indexOf(marker);

  if (index >= 0) {
    return `${pathname.slice(0, index)}${marker}`;
  }

  return "/client/";
}

function withQuery(pathname, params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, value);
    }
  });

  return query.toString() ? `${pathname}?${query.toString()}` : pathname;
}

export function pathFor(routeName, params = {}) {
  if (routeName === "examDetails") {
    return usesNodeRoutes()
      ? `/exam/${params.id}`
      : `${getClientBasePath()}pages/exam-details.html?id=${encodeURIComponent(params.id)}`;
  }

  if (routeName === "takeExam") {
    return usesNodeRoutes()
      ? `/take/${params.id}`
      : `${getClientBasePath()}pages/take-exam.html?id=${encodeURIComponent(params.id)}`;
  }

  const route = routes[routeName] || routes.home;

  if (usesNodeRoutes()) {
    return withQuery(route.clean, params);
  }

  return withQuery(`${getClientBasePath()}${route.staticPath}`, params);
}

export function goTo(routeName, params = {}) {
  window.location.href = pathFor(routeName, params);
}

export function getCurrentRouteId() {
  const params = new URLSearchParams(window.location.search);

  if (params.has("id")) {
    return params.get("id");
  }

  const parts = window.location.pathname.split("/").filter(Boolean);
  return parts.at(-1) || "";
}

export function setupNavigation(root = document) {
  root.querySelectorAll("[data-nav]").forEach(link => {
    link.setAttribute("href", pathFor(link.dataset.nav));
  });
}
