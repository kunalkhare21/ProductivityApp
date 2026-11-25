document.addEventListener("DOMContentLoaded", function () {
    if (!window.Storage) return;

    const params = new URLSearchParams(window.location.search);
    const projectId = params.get("id");

    const projects = Storage.getProjects();

    const project = projectId
        ? projects.find(function (item) {
            return String(item.id) === projectId;
        })
        : projects[0];

    const content = document.querySelector(".content");

    if (!content) return;

    if (!project) {
        content.innerHTML = `
            <div class="topbar">
                <a href="home.html" class="circle-btn">←</a>
                <h2>Detail</h2>
            </div>
            <h3>Project not found</h3>
            <p class="desc">This project may have been deleted.</p>
        `;
        return;
    }

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, function (char) {
            return {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"
            }[char];
        });
    }

    function formatDate(value) {
        if (!value) return "Not set";

        const date = new Date(value + "T00:00:00");

        if (Number.isNaN(date.getTime())) return "Not set";

        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
        });
    }

    const avatarClasses = ["a1", "a2", "a3", "a4", "a5"];

    const members = Array.isArray(project.members)
        ? project.members
        : [];

    const attachments = Array.isArray(project.attachments)
        ? project.attachments
        : [];
    let visibleAttachments = [];

    const subtasks = Array.isArray(project.subtasks)
        ? project.subtasks
        : [];

    const priority = escapeHTML(project.priority || "Medium");

    function renderProjectMembers(nextMembers) {
        const memberList = Array.isArray(nextMembers) ? nextMembers : [];
        const memberContainer = content.querySelector(".avatars.lg");
        if (!memberContainer) return;
        memberContainer.innerHTML = memberList.map(function (member, index) {
            const label = String(member);
            const initial = label.trim().charAt(0).toUpperCase() || "?";
            return `<span class="${avatarClasses[index % avatarClasses.length]}" title="${escapeHTML(label)}" aria-label="${escapeHTML(label)}">${escapeHTML(initial)}</span>`;
        }).join("");
    }

    window.renderProjectMembers = renderProjectMembers;

    function renderProjectAttachments(nextAttachments) {
        visibleAttachments = (Array.isArray(nextAttachments) ? nextAttachments : [])
            .filter(function (attachment) {
                return attachment && typeof attachment.data === "string" &&
                    attachment.data.indexOf("data:") === 0;
            });
        const attachmentHTML = visibleAttachments.length
        ? visibleAttachments.map(function (attachment, index) {
            const isImage = String(attachment.mimeType || "").startsWith("image/");

            return `
                <button type="button" class="att attachment-preview-button" data-attachment-index="${index}" aria-label="Preview ${escapeHTML(attachment.name)}">
                    <div class="th ${isImage ? "img" : ""}">
                        ${isImage
                            ? `<svg viewBox="0 0 24 24">
                                <rect x="4" y="4" width="16" height="16" rx="3"/>
                                <circle cx="9" cy="9" r="1.5"/>
                                <path d="M4 17l5-5 4 4 3-3 4 4"/>
                            </svg>`
                            : `<svg viewBox="0 0 24 24">
                                <path d="M6 3h8l4 4v14H6z"/>
                                <path d="M9 12h6M9 16h4"/>
                            </svg>`
                        }
                    </div>
                    <div>
                        <b>${escapeHTML(attachment.name)}</b>
                        <small>${escapeHTML(attachment.size || "")} · <em>Preview</em></small>
                    </div>
                </button>
            `;
        }).join("")
        : '<p class="desc">No attachments available.</p>';

        if (attachmentContainer) attachmentContainer.innerHTML = attachmentHTML;
    }

    window.renderProjectAttachments = renderProjectAttachments;

    const title = document.querySelector(".d-title");
    if (title) title.textContent = project.name || "Untitled Project";

    const priorityTag = content.querySelector(".tag.high");
    if (priorityTag) priorityTag.textContent = priority + " priority";

    const dateValues = content.querySelectorAll(".dates .d b");

    if (dateValues[0]) {
        dateValues[0].textContent = formatDate(project.startDate);
    }

    if (dateValues[1]) {
        dateValues[1].textContent = formatDate(project.dueDate);
    }

    const description = content.querySelector(".desc");
    if (description) {
        description.textContent = project.description || "No description available.";
    }

    const team = content.querySelector(".avatars.lg");
    if (team) renderProjectMembers(members);

    const ring = content.querySelector(".ring");
    function renderProjectProgress() {
        if (!ring) return;
        const linkedTasks = Storage.getTasks().filter(function (task) {
            return String(task.projectId) === String(project.id);
        });
        const completed = linkedTasks.filter(function (task) {
            const status = String(task.status || "").trim().toLowerCase();
            return status === "complete" || status === "completed" || status === "done";
        }).length;
        const progress = linkedTasks.length
            ? Math.round(completed / linkedTasks.length * 100)
            : 0;
        ring.innerHTML = `<span>${progress}%</span>`;
        ring.style.background = `conic-gradient(var(--primary) ${progress}%, #e6e5f5 ${progress}%)`;
    }

    renderProjectProgress();
    window.addEventListener("tasksUpdated", renderProjectProgress);
    window.addEventListener("storage", function (event) {
        if (event.key === "productivity_tasks") renderProjectProgress();
    });

    const attachmentContainer = content.querySelector(".attach");
    renderProjectAttachments(attachments);

    const previewModal = document.getElementById("attachmentPreviewModal");
    const previewContent = document.getElementById("attachmentPreviewContent");
    const previewTitle = document.getElementById("attachmentPreviewTitle");
    function closeAttachmentPreview() {
        if (previewModal) previewModal.style.display = "none";
        if (previewContent) previewContent.innerHTML = "";
    }
    if (previewModal && previewContent && previewTitle) {
        const closeButton = document.getElementById("closeAttachmentPreview");
        if (closeButton) closeButton.addEventListener("click", closeAttachmentPreview);
        previewModal.addEventListener("click", function (event) {
            if (event.target === previewModal) closeAttachmentPreview();
        });
        document.addEventListener("keydown", function (event) {
            if (event.key === "Escape") closeAttachmentPreview();
        });

        if (attachmentContainer) {
            attachmentContainer.addEventListener("click", function (event) {
                const button = event.target.closest("[data-attachment-index]");
                if (!button) return;
                const attachment = visibleAttachments[Number(button.dataset.attachmentIndex)];
                if (!attachment) return;

                const mimeType = String(attachment.mimeType || "application/octet-stream");
                previewTitle.textContent = attachment.name || "Attachment preview";
                if (mimeType.startsWith("image/")) {
                    previewContent.innerHTML = `<img class="attachment-preview-image" src="${escapeHTML(attachment.data)}" alt="${escapeHTML(attachment.name || "Attachment preview")}">`;
                } else if (mimeType === "application/pdf") {
                    previewContent.innerHTML = `<iframe class="attachment-preview-pdf" src="${escapeHTML(attachment.data)}" title="${escapeHTML(attachment.name || "PDF preview")}"></iframe><a class="attachment-download" href="${escapeHTML(attachment.data)}" download="${escapeHTML(attachment.name || "attachment.pdf")}">Download PDF</a>`;
                } else {
                    previewContent.innerHTML = `<p class="desc">Preview is not available for this file type.</p><a class="attachment-download" href="${escapeHTML(attachment.data)}" download="${escapeHTML(attachment.name || "attachment")}">Open or download ${escapeHTML(attachment.name || "attachment")}</a>`;
                }
                previewModal.style.display = "flex";
            });
        }
    }

    const accordion = content.querySelector(".acc");

    if (accordion) {
        const subtaskList = accordion.querySelector("ul");
        const subtaskHeading = accordion.querySelector(".h");
        const toggleSubtasks = function () {
            const isExpanded = subtaskHeading.getAttribute("aria-expanded") === "true";
            subtaskHeading.setAttribute("aria-expanded", String(!isExpanded));
            accordion.classList.toggle("collapsed", isExpanded);
        };
        const getSubtask = function (item) {
            if (typeof item === "string") {
                return { title: item, done: false };
            }
            if (!item || typeof item !== "object") {
                return { title: "", done: false };
            }
            const done = typeof item.completed === "boolean"
                ? item.completed
                : typeof item.done === "boolean"
                    ? item.done
                    : typeof item.isCompleted === "boolean"
                        ? item.isCompleted
                        : ["complete", "completed", "done"].includes(
                            String(item.status || "").trim().toLowerCase()
                        );
            return {
                title: String(item.title || item.name || ""),
                done: done
            };
        };
        const renderSubtasks = function () {
            const currentProject = Storage.getProjects().find(function (item) {
                return String(item.id) === String(project.id);
            });
            const projectSubtasks = Array.isArray(currentProject && currentProject.subtasks)
                ? currentProject.subtasks.map(function (item, index) {
                    return Object.assign(getSubtask(item), { index: index });
                }).filter(function (item) { return item.title; })
                : [];
            const linkedTasks = Storage.getTasks().filter(function (task) {
                return String(task.projectId) === String(project.id);
            });
            const taskComments = Storage.getTaskComments();
            let taskSubtaskCount = 0;
            const projectSubtaskHTML = projectSubtasks.length
                ? `<li class="project-subtask-group">
                    <strong>Project items</strong>
                    <ul class="project-subtask-items">${projectSubtasks.map(function (item) {
                        return `<li><label><input type="checkbox" data-project-subtask="${item.index}" ${item.done ? "checked" : ""}><span>${escapeHTML(item.title)}</span></label></li>`;
                    }).join("")}</ul>
                </li>`
                : "";
            const taskHTML = linkedTasks.map(function (task) {
                const subtasks = Array.isArray(task.subtasks) ? task.subtasks : [];
                const comments = Array.isArray(taskComments[task.id]) ? taskComments[task.id] : [];
                const visibleSubtasks = subtasks.map(function (item, index) {
                    return Object.assign(getSubtask(item), { index: index });
                }).filter(function (item) { return item.title; });
                if (!visibleSubtasks.length && !comments.length) return "";
                taskSubtaskCount += visibleSubtasks.length;
                const subtasksHTML = visibleSubtasks.map(function (item) {
                    return `<li><label><input type="checkbox" data-task-subtask="${escapeHTML(task.id)}" data-subtask-index="${item.index}" ${item.done ? "checked" : ""}><span>${escapeHTML(item.title)}</span></label></li>`;
                }).join("");
                const commentsHTML = comments.length
                    ? `<div class="project-subtask-comments"><strong>Comments</strong>${comments.map(function (comment) {
                        const message = typeof comment === "string" ? comment : (comment.text || comment.message || "");
                        const createdAt = typeof comment === "object" && comment ? comment.createdAt : "";
                        return `<p>${escapeHTML(message)}${createdAt ? `<small>${escapeHTML(createdAt)}</small>` : ""}</p>`;
                    }).join("")}</div>`
                    : "";
                return `<li class="project-subtask-group">
                    <strong>${escapeHTML(task.title || task.name || "Untitled task")}</strong>
                    ${visibleSubtasks.length ? `<ul class="project-subtask-items">${subtasksHTML}</ul>` : ""}
                    ${commentsHTML}
                </li>`;
            }).join("");
            const totalSubtasks = projectSubtasks.length + taskSubtaskCount;
            subtaskList.innerHTML = projectSubtaskHTML + taskHTML ||
                '<li class="empty-subtask">No subtasks or comments available</li>';
            const heading = subtaskHeading.querySelector("span");
            if (heading) heading.textContent = "Subtasks (" + totalSubtasks + ")";
        };

        renderSubtasks();
        subtaskHeading.addEventListener("click", toggleSubtasks);
        subtaskHeading.addEventListener("keydown", function (event) {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                toggleSubtasks();
            }
        });
        subtaskList.addEventListener("change", function (event) {
            const taskCheckbox = event.target.closest("[data-task-subtask]");
            if (taskCheckbox) {
                const taskId = taskCheckbox.dataset.taskSubtask;
                const index = Number(taskCheckbox.dataset.subtaskIndex);
                const latestTasks = Storage.getTasks();
                const task = latestTasks.find(function (item) {
                    return String(item.id) === String(taskId) &&
                        String(item.projectId) === String(project.id);
                });
                if (!task || !Array.isArray(task.subtasks) || !task.subtasks[index]) {
                    alert("Could not update this task subtask. Please refresh the project.");
                    renderSubtasks();
                    return;
                }
                const updatedTasks = latestTasks.map(function (item) {
                    if (String(item.id) !== String(taskId)) return item;
                    const updatedSubtasks = item.subtasks.map(function (subtask) {
                        const normalized = getSubtask(subtask);
                        return typeof subtask === "string"
                            ? { title: normalized.title, completed: taskCheckbox.checked }
                            : Object.assign({}, subtask, normalized, {
                                completed: taskCheckbox.checked,
                                done: taskCheckbox.checked
                            });
                    });
                    return Object.assign({}, item, { subtasks: updatedSubtasks });
                });
                if (!Storage.saveTasks(updatedTasks)) {
                    alert("Could not save this task subtask. Please try again.");
                    renderSubtasks();
                    return;
                }
                window.dispatchEvent(new Event("tasksUpdated"));
                return;
            }

            const checkbox = event.target.closest("[data-project-subtask]");
            if (!checkbox) return;
            const index = Number(checkbox.dataset.projectSubtask);
            const latestProjects = Storage.getProjects();
            const currentProject = latestProjects.find(function (item) {
                return String(item.id) === String(project.id);
            });
            if (!currentProject || !Array.isArray(currentProject.subtasks)) {
                alert("Could not update this subtask because the project is no longer available.");
                renderSubtasks();
                return;
            }
            const updatedSubtasks = currentProject.subtasks.map(function (subtask) {
                const normalized = getSubtask(subtask);
                return typeof subtask === "string"
                    ? { title: normalized.title, done: normalized.done, completed: normalized.done }
                    : Object.assign({}, subtask, normalized, {
                        done: normalized.done,
                        completed: normalized.done
                    });
            });
            if (!updatedSubtasks[index] || !updatedSubtasks[index].title) {
                alert("Could not update this subtask. Please refresh the project.");
                renderSubtasks();
                return;
            }
            updatedSubtasks[index].done = checkbox.checked;
            updatedSubtasks[index].completed = checkbox.checked;
            const updatedProjects = latestProjects.map(function (item) {
                return String(item.id) === String(project.id)
                    ? Object.assign({}, item, { subtasks: updatedSubtasks })
                    : item;
            });
            if (!Storage.saveProjects(updatedProjects)) {
                alert("Could not save this subtask. Please try again.");
                renderSubtasks();
                return;
            }
            window.dispatchEvent(new Event("projectsUpdated"));
        });
        window.addEventListener("tasksUpdated", renderSubtasks);
        window.addEventListener("storage", function (event) {
            if (event.key === "productivity_tasks" || event.key === "productivity_task_comments") {
                renderSubtasks();
            }
        });
    }

    document.title = (project.name || "Project") + " - Detail";
});
