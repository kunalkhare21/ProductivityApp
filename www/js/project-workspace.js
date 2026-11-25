(function () {
    "use strict";

    document.addEventListener("DOMContentLoaded", function () {
        const addButton = document.getElementById("addProjectTaskButton");
        const taskList = document.getElementById("projectTaskList");
        const summary = document.getElementById("projectTaskSummary");
        const emptyMessage = document.getElementById("projectTaskEmpty");

        if (!addButton || !taskList || !window.Storage) return;
        const navAddButton = document.getElementById("navAddAction");
        if (navAddButton) {
            navAddButton.addEventListener("click", function (event) {
                event.preventDefault();
                addButton.click();
            });
        }

        const params = new URLSearchParams(window.location.search);
        const projects = Storage.getProjects();
        const projectId = params.get("id") || (projects[0] && projects[0].id);

        if (!projectId) {
            summary.textContent = "No project selected.";
            return;
        }

        let activeFilter = "All";
        let editingTaskId = null;

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

        function getProjectTasks() {
            return Storage.getTasks().filter(function (task) {
                return String(task.projectId) === String(projectId);
            });
        }

        function getStatusClass(status) {
            const normalized = String(status || "").trim().toLowerCase();
            if (normalized === "completed" || normalized === "complete" || normalized === "done") return "completed";
            if (normalized === "in progress") return "in-progress";
            return "";
        }

        function isCompleted(task) {
            const status = String(task.status || "").trim().toLowerCase();
            return status === "completed" || status === "complete" || status === "done";
        }

        function renderTasks() {
            const allTasks = getProjectTasks();
            const taskComments = Storage.getTaskComments();

            const filteredTasks = activeFilter === "All"
                ? allTasks
                : allTasks.filter(function (task) {
                    if (activeFilter === "Completed") {
                        return isCompleted(task);
                    }
                    return String(task.status || "").toLowerCase() === activeFilter.toLowerCase();
                });

            const completed = allTasks.filter(isCompleted).length;

            summary.textContent =
                allTasks.length + " tasks Â· " + completed + " completed";

            taskList.innerHTML = filteredTasks.map(function (task) {
                const title = task.title || task.name || "Untitled task";
                const assignee = task.assignee || task.assignedTo || "Unassigned";
                const status = task.status || "To Do";
                const priority = task.priority || "Medium";
                const subtasks = Array.isArray(task.subtasks) ? task.subtasks : [];
                const commentCount = Array.isArray(taskComments[task.id])
                    ? taskComments[task.id].length
                    : 0;
                const dueDate = task.dueDate
                    ? new Date(task.dueDate + "T00:00:00").toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                    })
                    : "Not set";

                return `
                    <article class="project-task-card" data-task-id="${escapeHTML(task.id)}">
                        <div class="project-task-card-top">
                            <h4 class="project-task-card-title">
                                ${escapeHTML(title)}
                            </h4>
                        </div>

                        <div class="project-task-card-meta">
                            <span class="project-task-badge ${getStatusClass(status)}">
                                ${escapeHTML(status)}
                            </span>

                            <span class="project-task-badge ${priority.toLowerCase() === "high" ? "high" : ""}">
                                ${escapeHTML(priority)} priority
                            </span>
                        </div>

                        <div class="project-task-card-meta">
                            <span class="project-task-badge">
                                Assigned: ${escapeHTML(assignee)}
                            </span>
                            <span class="project-task-badge">
                                Due: ${escapeHTML(dueDate)}
                            </span>
                        </div>

                        <div class="project-task-card-meta">
                            <span class="project-task-badge">${subtasks.length} subtasks</span>
                            <span class="project-task-badge">${commentCount} comments</span>
                        </div>

                        <div class="project-task-card-actions">
                            <button type="button" data-pu-task-open="${escapeHTML(task.id)}">Details</button>
                            <button type="button" data-task-action="edit"
                                data-task-id="${escapeHTML(task.id)}">Edit</button>
                            <button type="button" data-task-action="delete"
                                data-task-id="${escapeHTML(task.id)}">Delete</button>
                        </div>
                    </article>
                `;
            }).join("");

            emptyMessage.style.display = filteredTasks.length ? "none" : "block";
        }

        function createModal() {
            if (document.getElementById("projectTaskModal")) return;

            document.body.insertAdjacentHTML("beforeend", `
                <div class="project-task-modal" id="projectTaskModal">
                    <div class="project-task-modal-content">
                        <h3 id="projectTaskModalTitle">Add Task</h3>

                        <form id="projectTaskForm">
                            <label for="projectTaskTitle">Task Name</label>
                            <input id="projectTaskTitle" name="title"
                                type="text" maxlength="150" required>

                            <label for="projectTaskDescription">Description</label>
                            <textarea id="projectTaskDescription"
                                name="description" rows="3"></textarea>

                            <label for="projectTaskAssignee">Assign To</label>
                            <input id="projectTaskAssignee" name="assignee"
                                type="text" maxlength="100"
                                placeholder="Enter team member name">

                            <label for="projectTaskStatus">Status</label>
                            <select id="projectTaskStatus" name="status">
                                <option value="To Do">To Do</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
                            </select>

                            <label for="projectTaskPriority">Priority</label>
                            <select id="projectTaskPriority" name="priority">
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                            </select>

                            <label for="projectTaskDueDate">Due Date</label>
                            <input id="projectTaskDueDate" name="dueDate"
                                type="date">

                            <div class="project-task-modal-actions">
                                <button type="button" id="cancelProjectTask">Cancel</button>
                                <button type="submit">Save Task</button>
                            </div>
                        </form>
                    </div>
                </div>
            `);
        }

        function openModal(task) {
            createModal();

            const modal = document.getElementById("projectTaskModal");
            const form = document.getElementById("projectTaskForm");

            editingTaskId = task ? task.id : null;

            form.reset();

            document.getElementById("projectTaskModalTitle").textContent =
                task ? "Edit Task" : "Add Task";

            if (task) {
                form.elements.title.value = task.title || task.name || "";
                form.elements.description.value = task.description || "";
                form.elements.assignee.value =
                    task.assignee || task.assignedTo || "";
                form.elements.status.value =
                    task.status === "Complete" ? "Completed" : (task.status || "To Do");
                form.elements.priority.value = task.priority || "Medium";
                form.elements.dueDate.value = task.dueDate || "";
            } else {
                form.elements.status.value = "To Do";
                form.elements.priority.value = "Medium";
            }

            modal.style.display = "flex";
        }

        function closeModal() {
            const modal = document.getElementById("projectTaskModal");
            if (modal) modal.style.display = "none";
        }

        addButton.addEventListener("click", function () {
            openModal(null);
        });

        document.addEventListener("click", function (event) {
            if (event.target.id === "cancelProjectTask") {
                closeModal();
            }

            if (event.target.id === "projectTaskModal") {
                closeModal();
            }
        });

        document.querySelectorAll(".project-task-filter").forEach(function (button) {
            button.addEventListener("click", function () {
                activeFilter = button.dataset.taskFilter;

                document.querySelectorAll(".project-task-filter").forEach(function (item) {
                    item.classList.toggle("active", item === button);
                });

                renderTasks();
            });
        });

        taskList.addEventListener("click", function (event) {
            const button = event.target.closest("button[data-task-action]");
            if (!button) return;

            const taskId = button.dataset.taskId;
            const tasks = Storage.getTasks();
            const task = tasks.find(function (item) {
                return String(item.id) === String(taskId);
            });

            if (!task) return;

            if (button.dataset.taskAction === "edit") {
                openModal(task);
            }

            if (button.dataset.taskAction === "delete") {
                if (!confirm("Are you sure you want to delete this task?")) return;

                if (Storage.saveTasks(tasks.filter(function (item) {
                    return String(item.id) !== String(taskId);
                }))) {
                    window.dispatchEvent(new Event("tasksUpdated"));
                }

                renderTasks();
            }
        });

        document.addEventListener("submit", function (event) {
            if (event.target.id !== "projectTaskForm") return;

            event.preventDefault();

            const form = event.target;
            const tasks = Storage.getTasks();

            const existingTask = editingTaskId
                ? tasks.find(function (task) {
                    return String(task.id) === String(editingTaskId);
                })
                : null;

            const taskData = {
                ...(existingTask || {}),
                id: existingTask ? existingTask.id :
                    (window.crypto && crypto.randomUUID
                        ? crypto.randomUUID()
                        : "task-" + Date.now()),
                projectId: projectId,
                title: form.elements.title.value.trim(),
                description: form.elements.description.value.trim(),
                assignee: form.elements.assignee.value.trim(),
                status: form.elements.status.value,
                priority: form.elements.priority.value,
                dueDate: form.elements.dueDate.value
            };

            if (!taskData.title) return;

            if (existingTask) {
                const index = tasks.findIndex(function (task) {
                    return String(task.id) === String(editingTaskId);
                });
                tasks[index] = taskData;
            } else {
                tasks.push(taskData);
            }

            if (Storage.saveTasks(tasks)) {
                window.dispatchEvent(new Event("tasksUpdated"));
                closeModal();
                renderTasks();
            } else {
                alert("Unable to save task. Please try again.");
            }
        });

        window.addEventListener("storage", renderTasks);
        window.addEventListener("tasksUpdated", renderTasks);

        renderTasks();
    });
})();
