document.addEventListener("DOMContentLoaded", function () {
    if (!window.Storage) return;

    function renderGreeting() {
        const profile = Storage.getProfile();
        const hour = new Date().getHours();
        const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
        const name = profile.name || "Your name";
        const greetingElement = document.getElementById("homeGreeting");
        const nameElement = document.getElementById("homeName");
        const picture = document.querySelector(".greet .pic");
        if (greetingElement) greetingElement.textContent = greeting;
        if (nameElement) nameElement.textContent = name;
        if (picture) {
            picture.textContent = name.charAt(0).toUpperCase();
            picture.style.display = "grid";
            picture.style.placeItems = "center";
            picture.style.color = "#fff";
            picture.style.fontWeight = "700";
            picture.style.backgroundImage = "";
            if (profile.avatar) {
                const image = document.createElement("img");
                image.src = profile.avatar;
                image.alt = "Profile picture";
                image.style.width = "100%";
                image.style.height = "100%";
                image.style.objectFit = "cover";
                picture.textContent = "";
                picture.appendChild(image);
            }
        }
    }

    renderGreeting();
    window.setInterval(renderGreeting, 60000);
    window.addEventListener("storage", function (event) {
        if (event.key === "productivity_profile") renderGreeting();
    });

    const createButton = document.getElementById("createProjectButton");
    if (createButton && window.location.hash === "#new-project") {
        createButton.click();
        history.replaceState(null, "", window.location.pathname);
    }
});
