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

    const subtasks = Array.isArray(project.subtasks)
        ? project.subtasks
        : [];

    const progress = Math.min(
        100,
        Math.max(0, Number(project.progress) || 0)
    );

    const priority = escapeHTML(project.priority || "Medium");

    const teamHTML = members.map(function (member, index) {
        return `<span class="${avatarClasses[index % avatarClasses.length]}">${escapeHTML(member)}</span>`;
    }).join("");

    const attachmentHTML = attachments.length
        ? attachments.map(function (attachment) {
            const isImage = attachment.type === "image";

            return `
                <div class="att">
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
                        <small>${escapeHTML(attachment.size || "")} • <em>Preview</em></small>
                    </div>
                </div>
            `;
        }).join("")
        : '<p class="desc">No attachments available.</p>';

    const subtasksHTML = subtasks.length
        ? subtasks.map(function (task) {
            return `<li><i></i>${escapeHTML(task)}</li>`;
        }).join("")
        : '<li><i></i>No subtasks available</li>';

    const totalTasks = Number(project.totalTasks) || 0;
    const comments = Number(project.comments) || 0;

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
    if (team) {
        team.innerHTML = teamHTML;
    }

    const ring = content.querySelector(".ring");
    if (ring) {
        ring.innerHTML = `<span>${progress}%</span>`;
    }

    const attachmentContainer = content.querySelector(".attach");
    if (attachmentContainer) {
        attachmentContainer.innerHTML = attachmentHTML;
    }

    const accordion = content.querySelector(".acc");

    if (accordion) {
        accordion.querySelector("ul").innerHTML = subtasksHTML;

        const heading = accordion.querySelector(".h span");
        if (heading) {
            heading.textContent = "Project Tasks";
        }

        const commentCount = accordion.querySelector(".cm");

        if (commentCount) {
            commentCount.innerHTML = `
                <svg viewBox="0 0 24 24">
                    <path d="M4 5h16v11H9l-5 4z"/>
                </svg>
                ${comments}
            `;
        }
    }

    document.title = (project.name || "Project") + " - Detail";
});
