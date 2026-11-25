document.addEventListener("DOMContentLoaded", function () {
    const projectContainer = document.querySelector(".proj-row");

    if (!projectContainer || !window.Storage) return;

    const avatarClasses = ["a1", "a2", "a3", "a4", "a5"];

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
        if (!value) return "";

        const date = new Date(value + "T00:00:00");

        if (Number.isNaN(date.getTime())) return "";

        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
        });
    }

    function renderProjects() {
        const projects = Storage.getProjects();
        const heading = projectContainer.previousElementSibling;

        if (!projects.length) {
            projectContainer.innerHTML = "";
            projectContainer.hidden = true;
            if (heading) heading.hidden = true;
            return;
        }
        projectContainer.hidden = false;
        if (heading) heading.hidden = false;

        projectContainer.innerHTML = projects.map(function (project) {
            const linkedTasks = Storage.getTasks().filter(function (task) {
                return String(task.projectId) === String(project.id);
            });
            const completed = linkedTasks.filter(function (task) {
                const status = String(task.status || "").toLowerCase();
                return status === "complete" || status === "completed" || status === "done";
            }).length;
            const total = linkedTasks.length;
            const progress = total ? Math.round(completed / total * 100) : 0;

            const members = Array.isArray(project.members)
                ? project.members
                : [];

            const priority = escapeHTML(project.priority || "Medium");
            const taskStatuses = linkedTasks.map(function (task) {
                return String(task.status || "").trim().toLowerCase();
            });
            const allCompleted = linkedTasks.length > 0 && taskStatuses.every(function (status) {
                return status === "complete" || status === "completed" || status === "done";
            });
            const status = escapeHTML(allCompleted
                ? "Completed"
                : taskStatuses.some(function (value) { return value === "in progress"; })
                    ? "In Progress"
                    : linkedTasks.length ? "Not Started" : (project.status || "Not Started"));

            const dateHTML = project.dueDate
                ? `<span class="tag date">
                    <svg viewBox="0 0 24 24">
                        <rect x="4" y="5" width="16" height="15" rx="3"/>
                        <path d="M8 3v4M16 3v4M4 10h16"/>
                    </svg>
                    ${escapeHTML(formatDate(project.dueDate))}
                </span>`
                : "";

            const avatarsHTML = members.map(function (member, index) {
                const avatarClass =
                    avatarClasses[index % avatarClasses.length];

                const label = String(member);
                const initial = label.includes("@") ? label.trim().charAt(0).toUpperCase() : label;
                return `<span class="${avatarClass}" title="${escapeHTML(label)}">${escapeHTML(initial)}</span>`;
            }).join("");

            return `
                <div class="proj" data-project-id="${escapeHTML(project.id)}">
                    <div class="tags">
                        <span class="tag high">${priority} priority</span>
                        ${dateHTML}
                    </div>

                    <div class="ttl">
                        <div class="pi">
                            <svg viewBox="0 0 24 24">
                                <rect x="5" y="3" width="14" height="18" rx="2"/>
                                <path d="M9 8h2M13 8h2M9 12h2M13 12h2M10 21v-4h4v4"/>
                            </svg>
                        </div>
                        ${escapeHTML(project.name)}
                    </div>

                    <div class="meta">
                        <span>${status}</span>
                        <b>${completed} of ${total} tasks</b>
                    </div>

                    <div class="bar">
                        <i style="width:${progress}%"></i>
                    </div>

                    <div class="foot">
                        <div class="avatars">${avatarsHTML}</div>
                    </div>
                </div>
            `;
        }).join("");
    }

    renderProjects();

    window.addEventListener("storage", function (event) {
        if (event.key === "productivity_projects") {
            renderProjects();
        }
    });

    window.addEventListener("projectsUpdated", renderProjects);
    window.addEventListener("tasksUpdated", renderProjects);
});

// Open the selected project details.
document.addEventListener("DOMContentLoaded", function () {
    const projectContainer = document.querySelector(".proj-row");

    if (!projectContainer) return;

    projectContainer.addEventListener("click", function (event) {
        const card = event.target.closest(".proj");

        if (!card) return;

        const projectId = card.dataset.projectId;

        if (!projectId) return;

        window.location.href =
            "detail.html?id=" + encodeURIComponent(projectId);
    });
});
