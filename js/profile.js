document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("profileForm");
    const imageInput = document.getElementById("profileImage");
    const imageLimit = 700 * 1024;
    let avatar = "";
    let profile = Storage.getProfile();

    function paintProfile() {
        const photo = document.getElementById("profilePhoto");
        const name = profile.name || "Your profile";
        document.getElementById("profileName").textContent = name;
        document.getElementById("profileEmail").textContent = profile.email || "";
        photo.textContent = name.charAt(0).toUpperCase();
        photo.style.backgroundImage = "";
        if (profile.avatar) {
            const image = document.createElement("img");
            image.src = profile.avatar;
            image.alt = "Profile picture";
            photo.textContent = "";
            photo.appendChild(image);
        }
    }

    form.elements.name.value = profile.name || "";
    form.elements.email.value = profile.email || "";
    form.elements.role.value = profile.role || "";
    form.elements.about.value = profile.about || "";
    form.elements.reminder.value = profile.reminder || "0";
    form.elements.dailySummary.checked = Boolean(profile.dailySummary);
    avatar = profile.avatar || "";
    paintProfile();

    imageInput.addEventListener("change", function () {
        const file = imageInput.files && imageInput.files[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            imageInput.value = "";
            alert("Please select an image file.");
            return;
        }
        if (file.size > imageLimit) {
            imageInput.value = "";
            alert("Choose an image smaller than 700 KB.");
            return;
        }
        const reader = new FileReader();
        reader.onload = function () {
            avatar = String(reader.result || "");
            profile = Object.assign({}, profile, { avatar: avatar });
            paintProfile();
        };
        reader.onerror = function () {
            console.error("Could not read the selected profile image:", reader.error);
            alert("Could not load this image. Please try another file.");
        };
        reader.readAsDataURL(file);
    });

    form.addEventListener("submit", function (event) {
        event.preventDefault();
        const session = JSON.parse(localStorage.getItem("productivity_session") || "null");
        const accounts = JSON.parse(localStorage.getItem("productivity_accounts") || "[]");
        const accountIndex = session ? accounts.findIndex(function (item) {
            return item.email === session.email;
        }) : -1;
        const nextEmail = form.elements.email.value.trim().toLowerCase();
        if (accounts.some(function (item, index) {
            return index !== accountIndex && item.email === nextEmail;
        })) {
            document.getElementById("profileMessage").textContent = "An account with this email already exists on this device.";
            return;
        }
        const updated = Object.assign({}, profile, {
            name: form.elements.name.value.trim(),
            email: nextEmail,
            role: form.elements.role.value.trim(),
            about: form.elements.about.value.trim(),
            reminder: form.elements.reminder.value,
            dailySummary: form.elements.dailySummary.checked,
            avatar: avatar
        });
        if (!Storage.saveProfile(updated)) {
            document.getElementById("profileMessage").textContent = "Could not save your profile. The image may be too large.";
            return;
        }
        if (accountIndex >= 0) {
            accounts[accountIndex].name = updated.name;
            accounts[accountIndex].email = updated.email;
            accounts[accountIndex].avatar = updated.avatar;
            accounts[accountIndex].role = updated.role;
            accounts[accountIndex].about = updated.about;
            accounts[accountIndex].reminder = updated.reminder;
            accounts[accountIndex].dailySummary = updated.dailySummary;
            try {
                localStorage.setItem("productivity_accounts", JSON.stringify(accounts));
                localStorage.setItem("productivity_session", JSON.stringify({ email: updated.email }));
            } catch (error) {
                console.error("Could not update local account details:", error);
                if (!Storage.saveProfile(profile)) {
                    console.error("Could not restore the previous profile after an account update failure.");
                }
                document.getElementById("profileMessage").textContent = "Could not update the account details.";
                return;
            }
        }
        profile = updated;
        paintProfile();
        document.getElementById("profileMessage").textContent = "Profile saved.";
    });

    document.getElementById("logoutButton").addEventListener("click", function () {
        localStorage.removeItem("productivity_session");
        window.location.replace("auth.html");
    });
});
