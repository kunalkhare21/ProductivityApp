
/* =========================================================
   PRODUCTIVITY APP - CALENDAR EVENT MANAGEMENT
   Add, edit, delete and search calendar events.
   ========================================================= */

(function () {
    "use strict";

    document.addEventListener("DOMContentLoaded", initializeCalendarEvents);

    function initializeCalendarEvents() {
        const addButton = document.getElementById("calendarAddEventButton");
        const searchButton = document.getElementById("calendarSearchButton");

        if (!addButton || !window.Storage) return;

        addButton.addEventListener("click", function () {
            openEventForm(null);
        });
        const navAddButton = document.getElementById("navAddAction");
        if (navAddButton) {
            navAddButton.addEventListener("click", function (event) {
                event.preventDefault();
                addButton.click();
            });
        }

        if (searchButton) {
            searchButton.addEventListener("click", openEventSearch);
        }

        const timeline = document.getElementById("calendarTimeline");

        if (timeline) {
            timeline.addEventListener("click", function (event) {
                const card = event.target.closest("[data-event-id]");
                if (!card) return;

                const eventItem = getEvents().find(function (item) {
                    return String(item.id) === String(card.dataset.eventId);
                });

                if (eventItem) openEventForm(eventItem);
            });
        }
    }

    function getEvents() {
        return Storage.getEvents() || [];
    }

    function saveEvents(events) {
        const result = Storage.saveEvents(events);
        window.dispatchEvent(new Event("eventsUpdated"));

        if (window.ProductivityCalendar) {
            window.ProductivityCalendar.render();
        }

        return result;
    }

    function getSelectedDate() {
        if (window.ProductivityCalendar) {
            return window.ProductivityCalendar.getSelectedDate();
        }

        return new Date().toISOString().slice(0, 10);
    }

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

    function makeId() {
        return window.crypto && typeof window.crypto.randomUUID === "function"
            ? "event-" + window.crypto.randomUUID()
            : "event-" + Date.now();
    }

    function createModal() {
        let modal = document.getElementById("puEventModal");

        if (modal) return modal;

        modal = document.createElement("div");
        modal.id = "puEventModal";
        modal.className = "pu-modal-host";

        modal.innerHTML = `
            <div class="pu-modal-backdrop" data-event-close></div>
            <section class="pu-modal" role="dialog" aria-modal="true">
                <button type="button" class="pu-modal-close" data-event-close>&#215;</button>
                <div id="puEventModalContent"></div>
            </section>
        `;

        document.body.appendChild(modal);

        modal.addEventListener("click", function (event) {
            if (event.target.closest("[data-event-close]")) {
                closeModal();
            }
        });

        return modal;
    }

    function openModal(title, html) {
        const modal = createModal();

        modal.querySelector("#puEventModalContent").innerHTML = `
            <h2 class="pu-modal-title">${escapeHTML(title)}</h2>
            ${html}
        `;

        modal.classList.add("pu-visible");
        document.body.classList.add("pu-modal-open");
    }

    function closeModal() {
        const modal = document.getElementById("puEventModal");

        if (modal) modal.classList.remove("pu-visible");

        document.body.classList.remove("pu-modal-open");
    }

    function openEventForm(existingEvent) {
        const editing = Boolean(existingEvent);

        const projects = Storage.getProjects() || [];
        const tasks = Storage.getTasks() || [];

        const taskOptions = tasks.map(function (task) {
            return `
                <option value="${escapeHTML(task.id)}"
                    ${existingEvent && String(existingEvent.taskId || "") === String(task.id) ? "selected" : ""}>
                    ${escapeHTML(task.title || task.name || "Untitled task")}
                </option>
            `;
        }).join("");

        const projectOptions = projects.map(function (project) {
            return `
                <option value="${escapeHTML(project.id)}"
                    ${existingEvent && String(existingEvent.projectId) === String(project.id) ? "selected" : ""}>
                    ${escapeHTML(project.name)}
                </option>
            `;
        }).join("");

        openModal(editing ? "Edit event" : "Create event", `
            <form id="puEventForm">
                <label class="pu-field-label">Event title</label>
                <input class="pu-input" name="title" maxlength="150"
                    required value="${escapeHTML(existingEvent ? existingEvent.title : "")}">

                <label class="pu-field-label">Date</label>
                <input class="pu-input" name="date" type="date" required
                    value="${escapeHTML(existingEvent ? existingEvent.date : getSelectedDate())}">

                <div class="pu-two-columns">
                    <div>
                        <label class="pu-field-label">Start time</label>
                        <input class="pu-input" name="startTime" type="time"
                            required value="${escapeHTML(existingEvent ? existingEvent.startTime : "09:00")}">
                    </div>
                    <div>
                        <label class="pu-field-label">End time</label>
                        <input class="pu-input" name="endTime" type="time"
                            required value="${escapeHTML(existingEvent ? existingEvent.endTime : "10:00")}">
                    </div>
                </div>

                <label class="pu-field-label">Location</label>
                <input class="pu-input" name="location" maxlength="150"
                    value="${escapeHTML(existingEvent ? existingEvent.location : "")}">

                <label class="pu-field-label">Related project</label>
                <select class="pu-input" name="projectId">
                    <option value="">No project</option>
                    ${projectOptions}
                </select>

                <label class="pu-field-label">Related task</label>
                <select class="pu-input" name="taskId">
                    <option value="">No task</option>
                    ${taskOptions}
                </select>

                <label class="pu-field-label">Event color</label>
                <select class="pu-input" name="color">
                    ${["lav", "mint", "peach", "pink"].map(function (color) {
                        return `<option value="${color}" ${existingEvent && existingEvent.color === color ? "selected" : ""}>${color}</option>`;
                    }).join("")}
                </select>

                <button class="pu-primary-button" type="submit">
                    ${editing ? "Save changes" : "Create event"}
                </button>

                ${editing ? `
                    <button class="pu-secondary-button" type="button" id="puDeleteEvent">
                        Delete event
                    </button>
                ` : ""}
            </form>
        `);

        const form = document.getElementById("puEventForm");

        form.addEventListener("submit", function (event) {
            event.preventDefault();

            const formData = new FormData(form);

            const title = String(formData.get("title") || "").trim();
            const date = String(formData.get("date") || "");
            const startTime = String(formData.get("startTime") || "");
            const endTime = String(formData.get("endTime") || "");

            if (!title || !date || !startTime || !endTime) {
                alert("Please complete all required fields.");
                return;
            }

            if (startTime >= endTime) {
                alert("End time must be later than start time.");
                return;
            }

            const events = getEvents();

            const updatedEvent = Object.assign({}, existingEvent || {}, {
                id: existingEvent ? existingEvent.id : makeId(),
                title: title,
                date: date,
                startTime: startTime,
                endTime: endTime,
                location: String(formData.get("location") || "").trim(),
                projectId: String(formData.get("projectId") || ""),
                taskId: String(formData.get("taskId") || ""),
                color: String(formData.get("color") || "lav")
            });

            if (editing) {
                const index = events.findIndex(function (item) {
                    return String(item.id) === String(existingEvent.id);
                });

                if (index < 0) {
                    alert("Event not found.");
                    return;
                }

                events[index] = updatedEvent;
            } else {
                events.push(updatedEvent);
            }

            if (saveEvents(events)) {
                closeModal();
            } else {
                alert("Unable to save event. Please try again.");
            }
        });

        const deleteButton = document.getElementById("puDeleteEvent");

        if (deleteButton) {
            deleteButton.addEventListener("click", function () {
                if (!confirm("Delete this event permanently?")) return;

                const events = getEvents().filter(function (item) {
                    return String(item.id) !== String(existingEvent.id);
                });

                if (saveEvents(events)) {
                    closeModal();
                } else {
                    alert("Unable to delete event.");
                }
            });
        }
    }

    function openEventSearch() {
        openModal("Search calendar events", `
            <input class="pu-input" id="puEventSearchInput"
                placeholder="Search events by title or location...">
            <div id="puEventSearchResults" class="pu-search-results">
                <p class="pu-muted">Start typing to search your events.</p>
            </div>
        `);

        const input = document.getElementById("puEventSearchInput");

        input.addEventListener("input", function () {
            const query = input.value.trim().toLowerCase();
            const results = document.getElementById("puEventSearchResults");

            if (!query) {
                results.innerHTML = '<p class="pu-muted">Start typing to search your events.</p>';
                return;
            }

            const matches = getEvents().filter(function (item) {
                return [item.title, item.location, item.date]
                    .some(function (value) {
                        return String(value || "").toLowerCase().includes(query);
                    });
            });

            results.innerHTML = matches.map(function (item) {
                return `
                    <button type="button" class="pu-search-result"
                        data-open-event="${escapeHTML(item.id)}">
                        <strong>${escapeHTML(item.title)}</strong>
                        <small>${escapeHTML(item.date)} Â· ${escapeHTML(item.startTime)} - ${escapeHTML(item.endTime)}</small>
                    </button>
                `;
            }).join("") || '<p class="pu-muted">No matching events found.</p>';
        });

        document.getElementById("puEventSearchResults").addEventListener("click", function (event) {
            const button = event.target.closest("[data-open-event]");
            if (!button) return;

            const item = getEvents().find(function (eventItem) {
                return String(eventItem.id) === String(button.dataset.openEvent);
            });

            if (!item) return;

            closeModal();
            openEventForm(item);
        });

        input.focus();
    }
})();

