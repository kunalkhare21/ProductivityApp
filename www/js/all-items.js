document.addEventListener("DOMContentLoaded", function () {
    if (!window.Storage) return;

    const params = new URLSearchParams(window.location.search);
    const view = params.get("view") === "tasks" ? "tasks" : "projects";
    const projectList = document.getElementById("allProjectsList");
    const taskList = document.getElementById("allTasksList");
    const filters = document.getElementById("taskListFilters");
    let activeTaskFilter = "All";

    function escapeHTML(value) {
        return String(value == null ? "" : value).replace(/[&<>"']/g, function (char) {
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
        if (!value) return "";
        const date = new Date(value + "T00:00:00");
        return Number.isNaN(date.getTime())
            ? ""
            : date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    }

    function renderProjects() {
        const projects = Storage.getProjects();
        if (!projects.length) {
            projectList.innerHTML = '<div class="all-items-empty">No projects yet. Use the + button to create your first project.</div>';
            return;
        }

        projectList.innerHTML = projects.map(function (project) {
            const members = Array.isArray(project.members) ? project.members : [];
            const linkedTasks = Storage.getTasks().filter(function (task) {
                return String(task.projectId) === String(project.id);
            });
            const completed = linkedTasks.filter(function (task) {
                const status = String(task.status || "").toLowerCase();
                return status === "complete" || status === "completed" || status === "done";
            }).length;
            const progress = linkedTasks.length ? Math.round(completed / linkedTasks.length * 100) : 0;
            const taskStatuses = linkedTasks.map(function (task) {
                return String(task.status || "").trim().toLowerCase();
            });
            const allCompleted = linkedTasks.length > 0 && taskStatuses.every(function (value) {
                return value === "complete" || value === "completed" || value === "done";
            });
            const status = allCompleted
                ? "Completed"
                : taskStatuses.some(function (value) { return value === "in progress"; })
                    ? "In Progress"
                    : linkedTasks.length ? "Not Started" : (project.status || "Not Started");
            const priority = escapeHTML(project.priority || "Medium");
            const dueDate = formatDate(project.dueDate);
            return `
                <a class="proj all-project-card" data-project-id="${escapeHTML(project.id)}" href="detail.html?id=${encodeURIComponent(project.id)}">
                    <div class="tags">
                        <span class="tag high">${priority} priority</span>
                        ${dueDate ? `<span class="tag date">${escapeHTML(dueDate)}</span>` : ""}
                    </div>
                    <div class="ttl">
                        <div class="pi"><svg viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h2M13 8h2M9 12h2M13 12h2M10 21v-4h4v4"/></svg></div>
                        ${escapeHTML(project.name || "Untitled project")}
                    </div>
                    <div class="meta"><span>${escapeHTML(status)}</span><b>${completed} of ${linkedTasks.length} tasks</b></div>
                    <div class="bar"><i style="width:${progress}%"></i></div>
                    <div class="foot">
                        <div class="avatars">${members.map(function (member, index) {
                            const label = String(member);
                            const initial = label.includes("@") ? label.trim().charAt(0).toUpperCase() : label;
                            return `<span class="a${index % 5 + 1}" title="${escapeHTML(label)}">${escapeHTML(initial)}</span>`;
                        }).join("")}</div>
                    </div>
                </a>`;
        }).join("");
    }

    function renderTasks(filter) {
        if (filter) activeTaskFilter = filter;
        const tasks = Storage.getTasks().filter(function (task) {
            if (activeTaskFilter === "All") return true;
            const status = String(task.status || "").toLowerCase();
            return activeTaskFilter === "Complete"
                ? status === "complete" || status === "completed" || status === "done"
                : status === activeTaskFilter.toLowerCase();
        });

        if (!tasks.length) {
            taskList.innerHTML = '<div class="all-items-empty">No tasks found for this status.</div>';
            return;
        }

        taskList.innerHTML = tasks.map(function (task) {
            return `
                <button type="button" class="task all-task-card" data-pu-task-open="${escapeHTML(task.id)}">
                    <span class="pi"><svg viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h2M13 8h2M9 12h2M13 12h2M10 21v-4h4v4"/></svg></span>
                    <span class="all-task-copy">
                        <strong>${escapeHTML(task.title || task.name || "Untitled task")}</strong>
                        <small>${escapeHTML(task.status || "To Do")}${task.dueDate ? " · Due " + escapeHTML(formatDate(task.dueDate)) : ""}</small>
                    </span>
                </button>`;
        }).join("");
    }

    if (view === "tasks") {
        document.title = "All tasks";
        document.getElementById("listTitle").textContent = "All tasks";
        document.getElementById("listHeading").textContent = "Your tasks";
        document.getElementById("listDescription").textContent = "All your tasks in one place.";
        projectList.hidden = true;
        taskList.hidden = false;
        filters.hidden = false;
        renderTasks("All");
        window.addEventListener("tasksUpdated", function () {
            renderTasks(activeTaskFilter);
        });
        filters.addEventListener("click", function (event) {
            const button = event.target.closest("[data-task-filter]");
            if (!button) return;
            filters.querySelectorAll(".chip").forEach(function (chip) {
                chip.classList.toggle("on", chip === button);
            });
            renderTasks(button.dataset.taskFilter);
        });
    } else {
        document.title = "All projects";
        renderProjects();
        window.addEventListener("projectsUpdated", renderProjects);
        window.addEventListener("tasksUpdated", renderProjects);
    }
});
