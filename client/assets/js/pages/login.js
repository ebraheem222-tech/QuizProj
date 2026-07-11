import { initializePage } from "../ui/layout.js";
import { showMessage } from "../ui/messages.js";
import { getFormValues } from "../utils/html.js";
import { goTo } from "../utils/router.js";

const { authService, currentUser } = initializePage({ activeRoute: "login", guestOnly: true });
const form = document.getElementById("loginForm");
const message = document.getElementById("loginMessage");

if (!currentUser) {
  form.addEventListener("submit", event => {
    event.preventDefault();

    const values = getFormValues(form);

    try {
      const user = authService.login(values.identifier, values.password);
      showMessage(message, "התחברת בהצלחה.", "success");
      setTimeout(() => goTo(user.getDashboardRoute()), 500);
    } catch (error) {
      showMessage(message, error.message, "danger");
    }
  });
}
