document.addEventListener("DOMContentLoaded", function () {
    if (!window.Storage) return;

    const params = new URLSearchParams(window.location.search);
    const projectId = params.get("id");

    const optionsButton = document.getElementById("projectOptionsButton");
    const optionsMenu = document.getElementById("projectOptionsMenu");
    const editButton = document.getElementById("editProjectButton");
    const deleteButton = document.getElementById("deleteProjectButton");

    const editModal = document.getElementById("editProjectModal");
    const editForm = document.getElementById("editProjectForm");
    const cancelEditButton = document.getElementById("cancelEditProjectButton");

    if (!optionsButton || !optionsMenu) return;

    function getProject() {
        return Storage.getProjects().find(function (item) {
            return String(item.id) === projectId;
        });
    }

    function closeMenu() {
        optionsMenu.style.display = "none";
        optionsButton.setAttribute("aria-expanded", "false");
    }

    function closeEditModal() {
        if (editModal) editModal.style.display = "none";
        if (editForm) editForm.reset();
    }

    // Open and close project options.
    optionsButton.setAttribute("aria-expanded", "false");

    optionsButton.addEventListener("click", function (event) {
        event.stopPropagation();

        const isOpen = optionsMenu.style.display === "block";

        optionsMenu.style.display = isOpen ? "none" : "block";
        optionsButton.setAttribute("aria-expanded", String(!isOpen));
    });

    optionsMenu.addEventListener("click", function (event) {
        event.stopPropagation();
    });

    document.addEventListener("click", closeMenu);

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            closeMenu();
            closeEditModal();
        }
    });

    // Open Edit Project modal with existing values.
    if (editButton && editModal && editForm) {
        editButton.addEventListener("click", function () {
            closeMenu();

            const project = getProject();

            if (!project) {
                alert("Project not found.");
                return;
            }

            editForm.elements.name.value = project.name || "";
            editForm.elements.description.value = project.description || "";
            editForm.elements.priority.value = project.priority || "Medium";
            editForm.elements.startDate.value = project.startDate || "";
            editForm.elements.dueDate.value = project.dueDate || "";
            editForm.elements.members.value = Array.isArray(project.members)
                ? project.members.join(", ")
                : "";

            editModal.style.display = "flex";
        });

        cancelEditButton.addEventListener("click", closeEditModal);

        editModal.addEventListener("click", function (event) {
            if (event.target === editModal) {
                closeEditModal();
            }
        });

        // Save changes to the existing project.
        editForm.addEventListener("submit", function (event) {
            event.preventDefault();

            const project = getProject();

            if (!project) {
                alert("Project not found.");
                return;
            }

            const name = editForm.elements.name.value.trim();
            const description = editForm.elements.description.value.trim();
            const priority = editForm.elements.priority.value;
            const startDate = editForm.elements.startDate.value;
            const dueDate = editForm.elements.dueDate.value;
            const membersInput = editForm.elements.members.value;

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

            const updatedProjects = Storage.getProjects().map(function (item) {
                if (String(item.id) !== projectId) return item;

                return {
                    ...item,
                    name: name,
                    description: description,
                    priority: priority,
                    startDate: startDate,
                    dueDate: dueDate,
                    members: membersInput
                        .split(",")
                        .map(function (member) {
                            return member.trim();
                        })
                        .filter(Boolean)
                };
            });

            if (!Storage.saveProjects(updatedProjects)) {
                alert("Could not save project changes. Please try again.");
                return;
            }

            closeEditModal();
            alert("Project updated successfully.");
            window.location.reload();
        });
    }

    // Delete project and its associated tasks and calendar events.
    if (deleteButton) {
        deleteButton.addEventListener("click", function () {
            closeMenu();

            if (!projectId) {
                alert("Project ID not found.");
                return;
            }

            const projects = Storage.getProjects();
            const project = projects.find(function (item) {
                return String(item.id) === projectId;
            });

            if (!project) {
                alert("Project not found.");
                return;
            }

            const confirmed = confirm(
                'Are you sure you want to delete "' +
                project.name +
                '"? Its associated tasks and calendar events will also be deleted.'
            );

            if (!confirmed) return;

            const updatedProjects = projects.filter(function (item) {
                return String(item.id) !== projectId;
            });

            if (!Storage.saveProjects(updatedProjects)) {
                alert("Could not delete the project. Please try again.");
                return;
            }

            const updatedTasks = Storage.getTasks().filter(function (task) {
                return String(task.projectId) !== projectId;
            });

            const updatedEvents = Storage.getEvents().filter(function (event) {
                return String(event.projectId) !== projectId;
            });

            const tasksSaved = Storage.saveTasks(updatedTasks);
            const eventsSaved = Storage.saveEvents(updatedEvents);

            if (!tasksSaved || !eventsSaved) {
                alert("Project deleted, but some associated data could not be updated.");
            } else {
                alert("Project deleted successfully.");
            }

            window.location.href = "home.html";
        });
    }
});
