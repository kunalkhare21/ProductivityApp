(function () {
    "use strict";
    const sessionKey = "productivity_session";
    const page = window.location.pathname.split("/").pop();
    if (page === "auth.html") return;

    try {
        const session = JSON.parse(localStorage.getItem(sessionKey) || "null");
        if (!session || !session.email) window.location.replace("auth.html");
    } catch (error) {
        console.error("Could not validate the current session:", error);
        window.location.replace("auth.html");
    }
})();
