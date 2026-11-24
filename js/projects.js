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

        if (!projects.length) {
            projectContainer.innerHTML =
                '<div class="proj">No projects available</div>';
            return;
        }

        projectContainer.innerHTML = projects.map(function (project) {
            const progress = Math.min(
                100,
                Math.max(0, Number(project.progress) || 0)
            );

            const completed = Number(project.completedTasks) || 0;
            const total = Number(project.totalTasks) || 0;

            const members = Array.isArray(project.members)
                ? project.members
                : [];

            const priority = escapeHTML(project.priority || "Medium");
            const status = escapeHTML(project.status || "Not Started");

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

                return `<span class="${avatarClass}">${escapeHTML(member)}</span>`;
            }).join("");

            const commentsHTML = Number(project.comments) > 0
                ? `<div class="r">
                    <span style="display:flex;align-items:center;gap:4px">
                        <svg viewBox="0 0 24 24">
                            <path d="M4 5h16v11H9l-5 4z"/>
                        </svg>
                        ${Number(project.comments)}
                    </span>
                    <svg viewBox="0 0 24 24">
                        <circle cx="6" cy="12" r="2.5"/>
                        <circle cx="18" cy="6" r="2.5"/>
                        <circle cx="18" cy="18" r="2.5"/>
                        <path d="M8.2 11l7.6-4M8.2 13l7.6 4"/>
                    </svg>
                </div>`
                : "";

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
                        ${commentsHTML}
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
