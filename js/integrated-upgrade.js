
/* =========================================================
   PRODUCTIVITY APP - INTEGRATED UPGRADE
   Keeps the original purple UI and existing LocalStorage data.
   ========================================================= */

(function () {
    "use strict";

    document.addEventListener("DOMContentLoaded", initializeUpgrade);

    function initializeUpgrade() {
        if (!window.Storage) {
            console.error("Productivity App Storage is not available.");
            return;
        }

        injectUpgradeStylesheet();
        createModalHost();
        updateDashboardStats();
        bindTaskDetails();
        bindSearch();
        bindNotifications();
        bindProfile();
        window.addEventListener("storage", refreshUpgrade);
        window.addEventListener("tasksUpdated", refreshUpgrade);
        window.addEventListener("projectsUpdated", refreshUpgrade);
    }

    function injectUpgradeStylesheet() {
        if (document.querySelector('[data-integrated-upgrade-css]')) return;

        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "css/integrated-upgrade.css";
        link.dataset.integratedUpgradeCss = "true";
        document.head.appendChild(link);
    }

    function createModalHost() {
        if (document.getElementById("puModalHost")) return;

        const host = document.createElement("div");
        host.id = "puModalHost";
        host.className = "pu-modal-host";
        host.innerHTML = `
            <div class="pu-modal-backdrop" data-pu-close></div>
            <section class="pu-modal" role="dialog" aria-modal="true">
                <button type="button" class="pu-modal-close" data-pu-close aria-label="Close">&#215;</button>
                <div class="pu-modal-content" id="puModalContent"></div>
            </section>
        `;
        document.body.appendChild(host);

        host.addEventListener("click", function (event) {
            if (event.target.closest("[data-pu-close]")) closeModal();
        });

        document.addEventListener("keydown", function (event) {
            if (event.key === "Escape") closeModal();
        });
    }

    function openModal(title, content) {
        const host = document.getElementById("puModalHost");
        const contentHost = document.getElementById("puModalContent");
        if (!host || !contentHost) return;

        contentHost.innerHTML = `
            <h2 class="pu-modal-title">${escapeHTML(title)}</h2>
            ${content}
        `;
        host.classList.add("pu-visible");
        document.body.classList.add("pu-modal-open");
    }

    function closeModal() {
        const host = document.getElementById("puModalHost");
        if (host) host.classList.remove("pu-visible");
        document.body.classList.remove("pu-modal-open");
    }

    function getProjects() {
        return Storage.getProjects() || [];
    }

    function getTasks() {
        return Storage.getTasks() || [];
    }

    function getEvents() {
        return Storage.getEvents() || [];
    }

    function saveTasks(tasks) {
        Storage.saveTasks(tasks);
        window.dispatchEvent(new Event("tasksUpdated"));
    }

    function saveProjects(projects) {
        Storage.saveProjects(projects);
        window.dispatchEvent(new Event("projectsUpdated"));
    }

    function saveEvents(events) {
        Storage.saveEvents(events);
        window.dispatchEvent(new Event("eventsUpdated"));
    }

    function getTaskComments() {
        return Storage.getTaskComments() || {};
    }

    function saveTaskComments(comments) {
        return Storage.saveTaskComments(comments);
    }

    function getProfile() {
        return Storage.getProfile() || {};
    }

    function saveProfile(profile) {
        Storage.saveProfile(profile);
    }

    function getNotifications() {
        return Storage.getNotifications() || [];
    }

    function saveNotifications(notifications) {
        Storage.saveNotifications(notifications);
    }

    function makeId(prefix) {
        if (window.crypto && typeof window.crypto.randomUUID === "function") {
            return prefix + "-" + window.crypto.randomUUID();
        }
        return prefix + "-" + Date.now() + "-" + Math.floor(Math.random() * 100000);
    }

    function escapeHTML(value) {
        return String(value == null ? "" : value).replace(/[&<>"']/g, function (char) {
            return {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            }[char];
        });
    }

    function refreshUpgrade() {
        updateDashboardStats();
    }

    /* ---------------- DASHBOARD STATS ---------------- */

    function updateDashboardStats() {
        const tasks = getTasks();
        const projects = getProjects();
        const today = startOfDay(new Date());

        const completed = tasks.filter(isCompleted).length;

        const inProgress = tasks.filter(function (task) {
            return normalizeStatus(task.status) === "in progress";
        }).length;

        const dueToday = tasks.filter(function (task) {
            if (!task.dueDate || isCompleted(task)) return false;

            const dueDate = parseTaskDate(task.dueDate);
            return !Number.isNaN(dueDate.getTime()) && sameDay(dueDate, today);
        }).length;

        const upcoming = tasks.filter(function (task) {
            if (!task.dueDate || isCompleted(task)) return false;

            const dueDate = parseTaskDate(task.dueDate);
            return !Number.isNaN(dueDate.getTime()) &&
                startOfDay(dueDate) > today;
        }).length;

        const values = [dueToday, inProgress, completed, upcoming];

        document.querySelectorAll(".stats .stat").forEach(function (card, index) {
            const number = card.querySelector(".n");

            if (!number || values[index] === undefined) return;

            const small = number.querySelector("small");
            number.textContent = String(values[index]) + " ";

            if (small) number.appendChild(small);
        });

        const dueTodayNode = document.querySelector("[data-dashboard-due-today]");
        if (dueTodayNode) dueTodayNode.textContent = dueToday;

        const projectCountNode = document.querySelector("[data-dashboard-project-count]");
        if (projectCountNode) projectCountNode.textContent = projects.length;
    }
    function normalizeStatus(status) {
        return String(status || "").trim().toLowerCase();
    }

    function isCompleted(task) {
        const status = normalizeStatus(task.status);
        return status === "completed" || status === "complete" || status === "done";
    }

    function startOfDay(date) {
        const result = new Date(date);
        result.setHours(0, 0, 0, 0);
        return result;
    }

    function parseTaskDate(value) {
        const parts = String(value).split("-").map(Number);
        if (parts.length !== 3 || parts.some(Number.isNaN)) return new Date(value);
        return new Date(parts[0], parts[1] - 1, parts[2]);
    }

    function sameDay(first, second) {
        return first.getFullYear() === second.getFullYear() &&
            first.getMonth() === second.getMonth() &&
            first.getDate() === second.getDate();
    }

    /* ---------------- TASK DETAILS ---------------- */

    function bindTaskDetails() {
        document.addEventListener("click", function (event) {
            const action = event.target.closest("[data-pu-task-open]");
            if (action) {
                event.preventDefault();
                openTaskDetails(action.dataset.puTaskOpen);
                return;
            }

            const taskCard = event.target.closest("[data-task-id]");
            if (!taskCard || event.target.closest("button, a, input, select, textarea")) return;

            const taskId = taskCard.dataset.taskId;
            if (taskId) openTaskDetails(taskId);
        });
    }

    function openTaskDetails(taskId) {
        const task = getTasks().find(function (item) {
            return String(item.id) === String(taskId);
        });
        if (!task) return;

        const comments = getTaskComments();
        const taskComments = Array.isArray(comments[taskId]) ? comments[taskId] : [];
        const subtasks = Array.isArray(task.subtasks) ? task.subtasks : [];
        const attachments = Array.isArray(task.attachments) ? task.attachments : [];
        function normalizeSubtask(item) {
            if (typeof item === "string") {
                return { title: item, completed: false };
            }
            if (!item || typeof item !== "object") {
                return { title: "", completed: false };
            }
            const completed = typeof item.completed === "boolean"
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
                completed: completed
            };
        }

        const content = `
            <div class="pu-task-detail">
                <label class="pu-field-label">Task title</label>
                <input class="pu-input" id="puTaskTitle" value="${escapeHTML(task.title || "")}">

                <label class="pu-field-label">Description</label>
                <textarea class="pu-textarea" id="puTaskDescription">${escapeHTML(task.description || "")}</textarea>

                <div class="pu-two-columns">
                    <div>
                        <label class="pu-field-label">Status</label>
                        <select class="pu-input" id="puTaskStatus">
                            ${option("To Do", task.status)}
                            ${option("In Progress", task.status)}
                            ${option("In Review", task.status)}
                            ${option("Completed", task.status)}
                        </select>
                    </div>
                    <div>
                        <label class="pu-field-label">Priority</label>
                        <select class="pu-input" id="puTaskPriority">
                            ${option("Low", task.priority)}
                            ${option("Medium", task.priority)}
                            ${option("High", task.priority)}
                            ${option("Urgent", task.priority)}
                        </select>
                    </div>
                </div>

                <label class="pu-field-label">Assignee</label>
                <input class="pu-input" id="puTaskAssignee" value="${escapeHTML(task.assignee || "")}">

                <label class="pu-field-label">Due date</label>
                <input class="pu-input" type="date" id="puTaskDueDate" value="${escapeHTML(task.dueDate || "")}">

                <button type="button" class="pu-primary-button" id="puSaveTask">Save task changes</button>

                <div class="pu-section-divider"></div>
                <h3 class="pu-section-title">Subtasks</h3>
                <div id="puSubtaskList">
                    ${subtasks.map(function (item, index) {
                        const subtask = normalizeSubtask(item);
                        return `
                            <label class="pu-subtask-row">
                                <input type="checkbox" data-subtask-index="${index}" ${subtask.completed ? "checked" : ""}>
                                <span>${escapeHTML(subtask.title)}</span>
                                <button type="button" class="pu-remove-subtask" data-remove-subtask="${index}" aria-label="Remove subtask">&#215;</button>
                            </label>
                        `;
                    }).join("") || '<p class="pu-muted">No subtasks yet.</p>'}
                </div>
                <div class="pu-inline-form">
                    <input class="pu-input" id="puNewSubtask" placeholder="Add a subtask">
                    <button type="button" class="pu-secondary-button" id="puAddSubtask">Add</button>
                </div>

                <div class="pu-section-divider"></div>
                <h3 class="pu-section-title">Comments</h3>
                <div class="pu-comment-list">
                    ${taskComments.map(function (comment) {
                        return `<div class="pu-comment"><p>${escapeHTML(comment.text || "")}</p><small>${escapeHTML(comment.createdAt || "")}</small></div>`;
                    }).join("") || '<p class="pu-muted">No comments yet.</p>'}
                </div>
                <textarea class="pu-textarea" id="puNewComment" placeholder="Write a comment..."></textarea>
                <button type="button" class="pu-secondary-button" id="puAddComment">Add comment</button>

                <div class="pu-section-divider"></div>
                <h3 class="pu-section-title">Attachments</h3>
                <input class="pu-input" type="file" id="puAttachmentInput">
                <p class="pu-muted">Maximum file size: 500 KB per file.</p>
                <div class="pu-attachment-list">
                    ${attachments.map(function (file, index) {
                        return `<div class="pu-attachment-row"><span>${escapeHTML(file.name || "Attachment")}</span><button type="button" data-remove-attachment="${index}" class="pu-remove-subtask">Remove</button></div>`;
                    }).join("") || '<p class="pu-muted">No attachments yet.</p>'}
                </div>
            </div>
        `;

        openModal("Task details", content);
        bindTaskDetailActions(taskId);
    }

    function option(value, selected) {
        return `<option value="${value}" ${normalizeStatus(value) === normalizeStatus(selected) ? "selected" : ""}>${value}</option>`;
    }

    function bindTaskDetailActions(taskId) {
        const host = document.getElementById("puModalContent");
        if (!host) return;

        host.querySelector("#puSaveTask").addEventListener("click", function () {
            const tasks = getTasks();
            const index = tasks.findIndex(function (item) {
                return String(item.id) === String(taskId);
            });
            if (index < 0) return;

            tasks[index] = Object.assign({}, tasks[index], {
                title: host.querySelector("#puTaskTitle").value.trim(),
                description: host.querySelector("#puTaskDescription").value.trim(),
                status: host.querySelector("#puTaskStatus").value,
                priority: host.querySelector("#puTaskPriority").value,
                assignee: host.querySelector("#puTaskAssignee").value.trim(),
                dueDate: host.querySelector("#puTaskDueDate").value
            });

            saveTasks(tasks);
            openTaskDetails(taskId);
        });

        host.querySelector("#puAddSubtask").addEventListener("click", function () {
            const input = host.querySelector("#puNewSubtask");
            const title = input.value.trim();
            if (!title) return;

            updateTask(taskId, function (task) {
                const subtasks = Array.isArray(task.subtasks) ? task.subtasks.slice() : [];
                subtasks.push({ id: makeId("subtask"), title: title, completed: false });
                task.subtasks = subtasks;
                return task;
            });
            openTaskDetails(taskId);
        });

        host.querySelectorAll("[data-subtask-index]").forEach(function (checkbox) {
            checkbox.addEventListener("change", function () {
                const index = Number(checkbox.dataset.subtaskIndex);
                updateTask(taskId, function (task) {
                    const subtasks = Array.isArray(task.subtasks) ? task.subtasks.slice() : [];
                    if (subtasks[index]) {
                        const item = subtasks[index];
                        const normalized = normalizeSubtask(item);
                        subtasks[index] = typeof item === "string"
                            ? { title: normalized.title, completed: checkbox.checked }
                            : Object.assign({}, item, {
                                completed: checkbox.checked,
                                done: checkbox.checked
                            });
                    }
                    task.subtasks = subtasks;
                    return task;
                });
                openTaskDetails(taskId);
            });
        });

        host.querySelectorAll("[data-remove-subtask]").forEach(function (button) {
            button.addEventListener("click", function () {
                const index = Number(button.dataset.removeSubtask);
                updateTask(taskId, function (task) {
                    const subtasks = Array.isArray(task.subtasks) ? task.subtasks.slice() : [];
                    subtasks.splice(index, 1);
                    task.subtasks = subtasks;
                    return task;
                });
                openTaskDetails(taskId);
            });
        });

        host.querySelector("#puAddComment").addEventListener("click", function () {
            const input = host.querySelector("#puNewComment");
            const text = input.value.trim();
            if (!text) return;

            const comments = getTaskComments();
            if (!Array.isArray(comments[taskId])) comments[taskId] = [];
            comments[taskId].push({
                id: makeId("comment"),
                text: text,
                createdAt: new Date().toLocaleString()
            });
            if (!saveTaskComments(comments)) {
                alert("Could not save this comment. Please try again.");
                return;
            }
            window.dispatchEvent(new Event("tasksUpdated"));
            openTaskDetails(taskId);
        });

        host.querySelector("#puAttachmentInput").addEventListener("change", function (event) {
            const file = event.target.files && event.target.files[0];
            if (!file) return;

            if (file.size > 500 * 1024) {
                alert("Please select a file smaller than 500 KB.");
                event.target.value = "";
                return;
            }

            const reader = new FileReader();
            reader.onload = function () {
                updateTask(taskId, function (task) {
                    const attachments = Array.isArray(task.attachments) ? task.attachments.slice() : [];
                    attachments.push({
                        id: makeId("attachment"),
                        name: file.name,
                        type: file.type,
                        size: file.size,
                        dataUrl: reader.result
                    });
                    task.attachments = attachments;
                    return task;
                });
                openTaskDetails(taskId);
            };
            reader.readAsDataURL(file);
        });

        host.querySelectorAll("[data-remove-attachment]").forEach(function (button) {
            button.addEventListener("click", function () {
                const index = Number(button.dataset.removeAttachment);
                updateTask(taskId, function (task) {
                    const attachments = Array.isArray(task.attachments) ? task.attachments.slice() : [];
                    attachments.splice(index, 1);
                    task.attachments = attachments;
                    return task;
                });
                openTaskDetails(taskId);
            });
        });
    }

    function updateTask(taskId, updater) {
        const tasks = getTasks();
        const index = tasks.findIndex(function (task) {
            return String(task.id) === String(taskId);
        });
        if (index < 0) return;
        tasks[index] = updater(Object.assign({}, tasks[index]));
        saveTasks(tasks);
    }

    /* ---------------- SEARCH ---------------- */

    function bindSearch() {
        document.addEventListener("click", function (event) {
            const searchButton = event.target.closest("[data-pu-search]");
            if (!searchButton) return;
            event.preventDefault();
            openSearch();
        });

        document.addEventListener("keydown", function (event) {
            if ((event.ctrlKey || event.metaKey) &&
                event.key.toLowerCase() === "k") {
                event.preventDefault();
                openSearch();
            }
        });
    }

    function openSearch() {
        openModal("Search projects and tasks", `
            <input class="pu-input" id="puSearchInput" placeholder="Search by name, task, status or priority...">
            <div class="pu-search-results" id="puSearchResults">
                <p class="pu-muted">Start typing to search your workspace.</p>
            </div>
        `);

        const input = document.getElementById("puSearchInput");
        input.addEventListener("input", function () {
            renderSearchResults(input.value);
        });
        input.focus();
    }

    function renderSearchResults(query) {
        const results = document.getElementById("puSearchResults");
        if (!results) return;

        const term = query.trim().toLowerCase();
        if (!term) {
            results.innerHTML = '<p class="pu-muted">Start typing to search your workspace.</p>';
            return;
        }

        const projectResults = getProjects().filter(function (project) {
            return [project.name, project.description, project.status, project.priority]
                .some(function (value) { return String(value || "").toLowerCase().includes(term); });
        });

        const taskResults = getTasks().filter(function (task) {
            return [task.title, task.description, task.status, task.priority, task.assignee]
                .some(function (value) { return String(value || "").toLowerCase().includes(term); });
        });

        results.innerHTML = `
            <h3 class="pu-section-title">Projects (${projectResults.length})</h3>
            ${projectResults.map(function (project) {
                return `<div class="pu-search-result"><strong>${escapeHTML(project.name)}</strong><small>${escapeHTML(project.status || "No status")}</small></div>`;
            }).join("") || '<p class="pu-muted">No matching projects.</p>'}
            <h3 class="pu-section-title">Tasks (${taskResults.length})</h3>
            ${taskResults.map(function (task) {
                return `<button type="button" class="pu-search-result pu-search-task" data-pu-task-open="${escapeHTML(task.id)}"><strong>${escapeHTML(task.title)}</strong><small>${escapeHTML(task.status || "No status")} Â· ${escapeHTML(task.priority || "No priority")}</small></button>`;
            }).join("") || '<p class="pu-muted">No matching tasks.</p>'}
        `;
    }

    /* ---------------- NOTIFICATIONS ---------------- */

    function bindNotifications() {
        const notificationButton = document.querySelector(".greet .circle-btn");
        if (notificationButton) {
            notificationButton.style.cursor = "pointer";
            notificationButton.addEventListener("click", function (event) {
                event.preventDefault();
                openNotifications();
            });
        }

        refreshDeadlineNotifications();
    }

    function refreshDeadlineNotifications() {
        const tasks = getTasks();
        const notifications = getNotifications();
        const today = startOfDay(new Date());
        const existing = new Set(notifications.map(function (item) { return item.id; }));

        tasks.forEach(function (task) {
            if (!task.dueDate || isCompleted(task)) return;
            const due = startOfDay(new Date(task.dueDate));
            const days = Math.round((due - today) / 86400000);
            if (days < 0 || days > 3) return;

            const id = "deadline-" + task.id + "-" + task.dueDate;
            if (existing.has(id)) return;

            notifications.unshift({
                id: id,
                title: days === 0 ? "Task due today" : "Upcoming task deadline",
                message: task.title + (days === 0 ? " is due today." : " is due in " + days + " day(s)."),
                createdAt: new Date().toLocaleString(),
                read: false
            });
        });

        saveNotifications(notifications.slice(0, 100));
    }

    function openNotifications() {
        refreshDeadlineNotifications();
        const notifications = getNotifications();

        openModal("Notifications", `
            <div class="pu-notification-list">
                ${notifications.map(function (item) {
                    return `<div class="pu-notification ${item.read ? "pu-read" : ""}">
                        <strong>${escapeHTML(item.title || "Notification")}</strong>
                        <p>${escapeHTML(item.message || "")}</p>
                        <small>${escapeHTML(item.createdAt || "")}</small>
                    </div>`;
                }).join("") || '<p class="pu-muted">You have no notifications.</p>'}
            </div>
            <button type="button" class="pu-secondary-button" id="puClearNotifications">Clear notifications</button>
        `);

        const clearButton = document.getElementById("puClearNotifications");
        if (clearButton) {
            clearButton.addEventListener("click", function () {
                saveNotifications([]);
                closeModal();
            });
        }

        saveNotifications(notifications.map(function (item) {
            return Object.assign({}, item, { read: true });
        }));
    }

    /* ---------------- PROFILE ---------------- */

    function bindProfile() {
        const nav = document.querySelector(".nav");
        if (!nav) return;

        const links = nav.querySelectorAll("a");
        const profileLink = links.length ? links[links.length - 1] : null;
        if (!profileLink) return;

        profileLink.addEventListener("click", function (event) {
            event.preventDefault();
            window.location.href = "profile.html";
        });
    }

    function openProfile() {
        window.location.href = "profile.html";
    }

    /* ---------------- GLOBAL HELPERS ---------------- */

    function bindGlobalActions() {
        document.addEventListener("click", function (event) {
            const openTask = event.target.closest("[data-pu-task-open]");
            if (openTask) {
                event.preventDefault();
                openTaskDetails(openTask.dataset.puTaskOpen);
            }
        });
    }

    window.ProductivityUpgrade = {
        openTaskDetails: openTaskDetails,
        openSearch: openSearch,
        openNotifications: openNotifications,
        openProfile: openProfile,
        refresh: refreshUpgrade,
        saveProject: function (project) {
            const projects = getProjects();
            const index = projects.findIndex(function (item) {
                return String(item.id) === String(project.id);
            });
            if (index >= 0) projects[index] = Object.assign({}, projects[index], project);
            else projects.push(project);
            saveProjects(projects);
        },
        saveEvent: function (eventItem) {
            const events = getEvents();
            const index = events.findIndex(function (item) {
                return String(item.id) === String(eventItem.id);
            });
            if (index >= 0) events[index] = Object.assign({}, events[index], eventItem);
            else events.push(eventItem);
            saveEvents(events);
        }
    };
})();
