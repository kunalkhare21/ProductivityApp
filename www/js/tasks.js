document.addEventListener("DOMContentLoaded", function () {
    const content = document.querySelector(".content");
    const chips = document.querySelector(".chips");
    const taskHeading = chips && chips.previousElementSibling;

    if (!content || !chips || !taskHeading || !window.Storage) return;

    let activeFilter = "To Do";

    function escapeHTML(value) {
        return String(value).replace(/[&<>"']/g, function (char) {
            return {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"
            }[char];
        });
    }

    function isCompleted(task) {
        const status = String(task.status || "").trim().toLowerCase();
        return status === "completed" ||
            status === "complete" ||
            status === "done";
    }

    function renderTasks() {
        const tasks = Storage.getTasks();
        const allTasks = Array.isArray(tasks) ? tasks : [];

        let oldTask = chips.nextElementSibling;

        while (oldTask && oldTask.classList.contains("task")) {
            const next = oldTask.nextElementSibling;
            oldTask.remove();
            oldTask = next;
        }

        const filteredTasks = allTasks.filter(function (task) {
            if (activeFilter === "Complete") {
                return isCompleted(task);
            }

            return String(task.status || "") === activeFilter;
        });

        const hasTasks = allTasks.length > 0;
        taskHeading.hidden = !hasTasks;
        chips.hidden = !hasTasks;
        if (!hasTasks || filteredTasks.length === 0) {
            return;
        }

        let lastElement = chips;

        filteredTasks.forEach(function (task) {
            const item = document.createElement("div");
            item.className = "task";
            item.dataset.taskId = task.id;

            item.innerHTML = `
                <div class="pi">
                    <svg viewBox="0 0 24 24">
                        <rect x="5" y="3" width="14" height="18" rx="2"/>
                        <path d="M9 8h2M13 8h2M9 12h2M13 12h2M10 21v-4h4v4"/>
                    </svg>
                </div>
                ${escapeHTML(task.title || task.name || "Untitled task")}
            `;

            lastElement.insertAdjacentElement("afterend", item);
            lastElement = item;
        });
    }

    chips.addEventListener("click", function (event) {
        const chip = event.target.closest(".chip");

        if (!chip) return;

        activeFilter = chip.textContent.trim();

        chips.querySelectorAll(".chip").forEach(function (item) {
            item.classList.remove("on");
        });

        chip.classList.add("on");
        renderTasks();
    });

    renderTasks();

    window.addEventListener("storage", function (event) {
        if (event.key === "productivity_tasks") {
            renderTasks();
        }
    });

    window.addEventListener("tasksUpdated", renderTasks);
});
