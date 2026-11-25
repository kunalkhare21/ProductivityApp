(function () {
    "use strict";

    const accountsKey = "productivity_accounts";
    const sessionKey = "productivity_session";
    const profileKey = "productivity_profile";
    const form = document.getElementById("authForm");
    const nameField = document.getElementById("nameField");
    const error = document.getElementById("authError");
    const submit = document.getElementById("authSubmit");
    let mode = "login";

    function readAccounts() {
        try {
            const accounts = JSON.parse(localStorage.getItem(accountsKey) || "[]");
            return Array.isArray(accounts) ? accounts : [];
        } catch (readError) {
            console.error("Could not read local accounts:", readError);
            return [];
        }
    }

    function setMode(nextMode) {
        mode = nextMode;
        const signingUp = mode === "signup";
        nameField.hidden = !signingUp;
        nameField.querySelector("input").required = signingUp;
        document.getElementById("loginTab").classList.toggle("active", !signingUp);
        document.getElementById("signupTab").classList.toggle("active", signingUp);
        submit.textContent = signingUp ? "Create account" : "Login";
        form.elements.password.autocomplete = signingUp ? "new-password" : "current-password";
        error.hidden = true;
    }

    async function hashPassword(password, salt) {
        if (!window.crypto || !window.crypto.subtle) {
            throw new Error("Secure password storage is unavailable in this app environment.");
        }
        const key = await window.crypto.subtle.importKey(
            "raw",
            new TextEncoder().encode(password),
            "PBKDF2",
            false,
            ["deriveBits"]
        );
        const digest = await window.crypto.subtle.deriveBits({
            name: "PBKDF2",
            salt: new TextEncoder().encode(salt),
            iterations: 120000,
            hash: "SHA-256"
        }, key, 256);
        return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
    }

    function createSalt() {
        const bytes = window.crypto.getRandomValues(new Uint8Array(16));
        return Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
    }

    document.getElementById("loginTab").addEventListener("click", () => setMode("login"));
    document.getElementById("signupTab").addEventListener("click", () => setMode("signup"));

    form.addEventListener("submit", async event => {
        event.preventDefault();
        error.hidden = true;
        submit.disabled = true;
        const email = form.elements.email.value.trim().toLowerCase();
        const password = form.elements.password.value;

        try {
            const accounts = readAccounts();
            let account;
            if (mode === "signup") {
                const name = form.elements.name.value.trim();
                if (!name) throw new Error("Enter your name to create an account.");
                if (password.length < 8) throw new Error("Use a password with at least 8 characters.");
                if (accounts.some(item => item.email === email)) {
                    throw new Error("An account with this email already exists on this device.");
                }
                const salt = createSalt();
                account = {
                    name,
                    email,
                    salt,
                    passwordHash: await hashPassword(password, salt),
                    avatar: "",
                    role: "",
                    about: "",
                    reminder: "0",
                    dailySummary: false
                };
                accounts.push(account);
                localStorage.setItem(accountsKey, JSON.stringify(accounts));
                localStorage.setItem(profileKey, JSON.stringify({
                    name,
                    email,
                    avatar: "",
                    role: "",
                    about: "",
                    reminder: "0",
                    dailySummary: false
                }));
            } else {
                account = null;
                for (const item of accounts) {
                    if (item.email === email && item.salt &&
                        item.passwordHash === await hashPassword(password, item.salt)) {
                        account = item;
                        break;
                    }
                }
                if (!account) throw new Error("Email or password is incorrect.");
                const oldProfile = JSON.parse(localStorage.getItem(profileKey) || "{}");
                if (oldProfile.email !== account.email) {
                    localStorage.setItem(profileKey, JSON.stringify({
                        avatar: account.avatar || "",
                        role: account.role || "",
                        about: account.about || "",
                        reminder: account.reminder || "0",
                        dailySummary: Boolean(account.dailySummary),
                        name: account.name,
                        email: account.email
                    }));
                }
            }

            localStorage.setItem(sessionKey, JSON.stringify({ email: account.email }));
            window.location.replace("home.html");
        } catch (submitError) {
            console.error("Sign-in error:", submitError);
            error.textContent = submitError.message || "Could not complete sign-in. Please try again.";
            error.hidden = false;
        } finally {
            submit.disabled = false;
        }
    });

    try {
        const session = JSON.parse(localStorage.getItem(sessionKey) || "null");
        if (session && session.email) window.location.replace("home.html");
    } catch (readError) {
        console.error("Could not read the current session:", readError);
    }
})();
