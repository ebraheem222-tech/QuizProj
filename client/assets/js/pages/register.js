import { initializePage } from "../ui/layout.js";
import { showMessage } from "../ui/messages.js";
import { getFormValues } from "../utils/html.js";
import { goTo } from "../utils/router.js";

const { authService, currentUser } = initializePage({ activeRoute: "register", guestOnly: true });
const form = document.getElementById("registerForm");
const message = document.getElementById("registerMessage");

if (!currentUser) {
  form.addEventListener("submit", event => {
    event.preventDefault();

    try {
      const user = authService.register(getFormValues(form));
      showMessage(message, "החשבון נוצר בהצלחה. מעבירים לדף המתאים.", "success");
      setTimeout(() => goTo(user.getDashboardRoute()), 600);
    } catch (error) {
      showMessage(message, error.message, "danger");
    }
  });
}
