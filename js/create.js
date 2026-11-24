document.addEventListener("DOMContentLoaded", function () {
    const createButton = document.getElementById("createProjectButton");
    const modal = document.getElementById("projectModal");
    const cancelButton = document.getElementById("cancelProjectButton");
    const form = document.getElementById("createProjectForm");

    if (!createButton || !modal || !cancelButton || !form || !window.Storage) {
        return;
    }

    function openModal() {
        modal.style.display = "flex";
    }

    function closeModal() {
        modal.style.display = "none";
        form.reset();
    }

    createButton.addEventListener("click", function (event) {
        event.preventDefault();
        openModal();
    });

    cancelButton.addEventListener("click", closeModal);

    modal.addEventListener("click", function (event) {
        if (event.target === modal) {
            closeModal();
        }
    });

    form.addEventListener("submit", function (event) {
        event.preventDefault();

        const formData = new FormData(form);

        const name = String(formData.get("name") || "").trim();
        const description = String(formData.get("description") || "").trim();
        const priority = String(formData.get("priority") || "Medium");
        const startDate = String(formData.get("startDate") || "");
        const dueDate = String(formData.get("dueDate") || "");
        const membersInput = String(formData.get("members") || "");

        if (!name) {
            alert("Please enter a project name.");
            return;
        }

        if (!startDate || !dueDate) {
            alert("Please select both project dates.");
            return;
        }

        if (dueDate < startDate) {
            alert("Due date cannot be earlier than start date.");
            return;
        }

        if (!["Low", "Medium", "High"].includes(priority)) {
            alert("Please select a valid priority.");
            return;
        }

        const projects = Storage.getProjects();

        const project = {
            id: "project-" + Date.now(),
            name: name,
            priority: priority,
            status: "Not Started",
            startDate: startDate,
            dueDate: dueDate,
            description: description,
            progress: 0,
            totalTasks: 0,
            completedTasks: 0,
            members: membersInput
                .split(",")
                .map(function (member) {
                    return member.trim();
                })
                .filter(Boolean),
            comments: 0,
            attachments: [],
            subtasks: []
        };

        projects.push(project);

        if (!Storage.saveProjects(projects)) {
            alert("Could not save the project. Please try again.");
            return;
        }

        window.dispatchEvent(new Event("projectsUpdated"));

        closeModal();

        const projectContainer = document.querySelector(".proj-row");
        const newCard = projectContainer?.querySelector(
            '[data-project-id="' + project.id + '"]'
        );

        if (projectContainer && newCard) {
            const scrollPosition =
                newCard.offsetLeft - projectContainer.offsetLeft;

            projectContainer.scrollTo({
                left: scrollPosition,
                behavior: "smooth"
            });
        }

        console.log("Project created successfully:", project.name);
    });
});
