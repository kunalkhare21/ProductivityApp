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
    const addMemberButton = document.getElementById("addProjectMemberButton");
    const addMemberModal = document.getElementById("addMemberModal");
    const addMemberForm = document.getElementById("addMemberForm");
    const cancelAddMemberButton = document.getElementById("cancelAddMemberButton");
    const attachmentInput = document.getElementById("projectAttachmentInput");

    if (!optionsButton || !optionsMenu) return;

    function getProject() {
        return Storage.getProjects().find(function (item) {
            return String(item.id) === projectId;
        });
    }

    function closeMemberModal() {
        if (addMemberModal) addMemberModal.style.display = "none";
        if (addMemberForm) addMemberForm.reset();
        const message = document.getElementById("memberFormMessage");
        if (message) message.textContent = "";
    }

    if (addMemberButton && addMemberModal && addMemberForm) {
        addMemberButton.addEventListener("click", function () {
            addMemberModal.style.display = "flex";
            addMemberForm.elements.email.focus();
        });
        if (cancelAddMemberButton) cancelAddMemberButton.addEventListener("click", closeMemberModal);
        addMemberModal.addEventListener("click", function (event) {
            if (event.target === addMemberModal) closeMemberModal();
        });
        addMemberForm.addEventListener("submit", function (event) {
            event.preventDefault();
            const message = document.getElementById("memberFormMessage");
            const email = addMemberForm.elements.email.value.trim().toLowerCase();
            if (!addMemberForm.elements.email.checkValidity() ||
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                message.textContent = "Enter a valid email address.";
                return;
            }

            const project = getProject();
            if (!project) {
                message.textContent = "This project could not be found.";
                return;
            }
            const members = Array.isArray(project.members) ? project.members.slice() : [];
            if (members.some(function (member) {
                return String(member).trim().toLowerCase() === email;
            })) {
                message.textContent = "This email is already a team member.";
                return;
            }
            members.push(email);
            const updatedProjects = Storage.getProjects().map(function (item) {
                return String(item.id) === projectId ? Object.assign({}, item, { members: members }) : item;
            });
            if (!Storage.saveProjects(updatedProjects)) {
                message.textContent = "Could not save this team member. Please try again.";
                return;
            }

            if (typeof window.renderProjectMembers === "function") {
                window.renderProjectMembers(members);
            }
            window.dispatchEvent(new Event("projectsUpdated"));
            closeMemberModal();
        });
    }

    if (attachmentInput) {
        attachmentInput.addEventListener("change", async function () {
            const files = Array.from(attachmentInput.files || []);
            if (!files.length) return;
            const project = getProject();
            if (!project) {
                alert("This project could not be found.");
                attachmentInput.value = "";
                return;
            }

            const attachments = Array.isArray(project.attachments) ? project.attachments.slice() : [];
            const maximumFileSize = 700 * 1024;
            try {
                for (const file of files) {
                    if (file.size > maximumFileSize) {
                        throw new Error(file.name + " is larger than 700 KB. Choose a smaller file.");
                    }
                    const data = await new Promise(function (resolve, reject) {
                        const reader = new FileReader();
                        reader.onload = function () { resolve(String(reader.result || "")); };
                        reader.onerror = function () { reject(reader.error || new Error("Could not read " + file.name)); };
                        reader.readAsDataURL(file);
                    });
                    attachments.push({
                        name: file.name,
                        size: Math.max(1, Math.ceil(file.size / 1024)) + " KB",
                        type: file.type.startsWith("image/") ? "image" : file.type === "application/pdf" ? "pdf" : "file",
                        mimeType: file.type || "application/octet-stream",
                        data: data
                    });
                }

                const updatedProjects = Storage.getProjects().map(function (item) {
                    return String(item.id) === projectId ? Object.assign({}, item, { attachments: attachments }) : item;
                });
                if (!Storage.saveProjects(updatedProjects)) {
                    alert("Could not save the attachment. Device storage may be full; try a smaller file.");
                    return;
                }
                if (typeof window.renderProjectAttachments === "function") {
                    window.renderProjectAttachments(attachments);
                }
                window.dispatchEvent(new Event("projectsUpdated"));
            } catch (error) {
                console.error("Could not add project attachment:", error);
                alert(error.message || "Could not add the attachment.");
            } finally {
                attachmentInput.value = "";
            }
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
            closeMemberModal();
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
                ? project.members.filter(function (member) {
                    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(member).trim());
                }).join(", ")
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
            const memberEmails = membersInput.split(/[,\n;]/)
                .map(function (member) { return member.trim().toLowerCase(); })
                .filter(Boolean);

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

            const memberEmailInput = editForm.elements.members;
            const invalidEmail = memberEmails.find(function (email) {
                return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
            });
            const memberMessage = document.getElementById("editMemberFormMessage");
            if (invalidEmail) {
                if (memberMessage) memberMessage.textContent = "Enter valid email addresses, separated by commas.";
                memberEmailInput.focus();
                return;
            }
            if (new Set(memberEmails).size !== memberEmails.length) {
                if (memberMessage) memberMessage.textContent = "Remove duplicate email addresses.";
                memberEmailInput.focus();
                return;
            }
            if (memberMessage) memberMessage.textContent = "";

            const updatedProjects = Storage.getProjects().map(function (item) {
                if (String(item.id) !== projectId) return item;

                return {
                    ...item,
                    name: name,
                    description: description,
                    priority: priority,
                    startDate: startDate,
                    dueDate: dueDate,
                    members: memberEmails
                };
            });

            if (!Storage.saveProjects(updatedProjects)) {
                alert("Could not save project changes. Please try again.");
                return;
            }

            closeEditModal();
            if (typeof window.renderProjectMembers === "function") {
                window.renderProjectMembers(memberEmails);
            }
            window.dispatchEvent(new Event("projectsUpdated"));
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
