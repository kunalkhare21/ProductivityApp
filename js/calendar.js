document.addEventListener("DOMContentLoaded", function () {
    if (!window.Storage) return;

    const monthHeading = document.getElementById("calendarMonth");
    const weekContainer = document.getElementById("calendarWeek");
    const timeline = document.getElementById("calendarTimeline");
    const previousWeekButton = document.getElementById("previousCalendarWeek");
    const nextWeekButton = document.getElementById("nextCalendarWeek");

    if (!monthHeading || !weekContainer || !timeline) return;

    const HOUR_HEIGHT = 150;
    const START_HOUR = 9;
    const END_HOUR = 15;

    let selectedDate = new Date();

    const colors = ["lav", "mint", "peach", "pink"];
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

    function dateKey(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }

    function formatTime(value) {
        const parts = String(value || "").split(":");
        const hours = Number(parts[0]);
        const minutes = Number(parts[1]);

        if (
            parts.length !== 2 ||
            !Number.isInteger(hours) ||
            !Number.isInteger(minutes) ||
            hours < 0 || hours > 23 ||
            minutes < 0 || minutes > 59
        ) {
            return "";
        }

        const suffix = hours >= 12 ? "PM" : "AM";
        const displayHour = hours % 12 || 12;

        return `${String(displayHour).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${suffix}`;
    }

    function timeToMinutes(value) {
        const parts = String(value || "").split(":");

        if (parts.length !== 2) return null;

        const hours = Number(parts[0]);
        const minutes = Number(parts[1]);

        if (
            !Number.isInteger(hours) ||
            !Number.isInteger(minutes) ||
            hours < 0 || hours > 23 ||
            minutes < 0 || minutes > 59
        ) {
            return null;
        }

        return hours * 60 + minutes;
    }

    function getMonday(date) {
        const result = new Date(date);
        const day = result.getDay();

        result.setDate(result.getDate() - (day === 0 ? 6 : day - 1));
        result.setHours(0, 0, 0, 0);

        return result;
    }

    function renderMonth() {
        monthHeading.innerHTML = `
            ${selectedDate.toLocaleDateString("en-US", {
                month: "long",
                year: "numeric"
            })}
            <svg viewBox="0 0 24 24">
                <path d="M6 9l6 6 6-6"/>
            </svg>
        `;
    }

    function renderWeek() {
        const monday = getMonday(selectedDate);
        const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

        weekContainer.innerHTML = dayNames.map(function (name, index) {
            const date = new Date(monday);
            date.setDate(monday.getDate() + index);

            const isSelected = dateKey(date) === dateKey(selectedDate);
            const isWeekend = index >= 5;

            return `
                <div class="day ${isSelected ? "on" : ""} ${isWeekend ? "dim" : ""}"
                     data-date="${dateKey(date)}">
                    <span>${name}</span>
                    <b>${date.getDate()}</b>
                </div>
            `;
        }).join("");
    }

    function renderTimeline() {
        const events = Storage.getEvents().filter(function (event) {
            return event.date === dateKey(selectedDate);
        });

        const hoursHTML = [];

        for (let hour = START_HOUR; hour <= END_HOUR; hour++) {
            const suffix = hour >= 12 ? "PM" : "AM";
            const displayHour = hour % 12 || 12;

            hoursHTML.push(`
                <span class="hr" style="top:${(hour - START_HOUR) * HOUR_HEIGHT}px">
                    ${String(displayHour).padStart(2, "0")}:00 ${suffix}
                </span>
            `);
        }

        const eventHTML = events.map(function (event, index) {
            const start = timeToMinutes(event.startTime);
            const end = timeToMinutes(event.endTime);

            if (
                start === null ||
                end === null ||
                end <= start ||
                end <= START_HOUR * 60 ||
                start >= END_HOUR * 60
            ) {
                return "";
            }

            const visibleStart = Math.max(start, START_HOUR * 60);
            const visibleEnd = Math.min(end, END_HOUR * 60);

            const top = ((visibleStart - START_HOUR * 60) / 60) * HOUR_HEIGHT;
            const height = Math.max(
                55,
                ((visibleEnd - visibleStart) / 60) * HOUR_HEIGHT - 12
            );

            const color = colors.includes(event.color)
                ? event.color
                : colors[index % colors.length];

            const project = Storage.getProjects().find(function (item) {
                return String(item.id) === String(event.projectId);
            });

            const members = Array.isArray(project?.members)
                ? project.members
                : [];

            const avatarsHTML = members.map(function (member, memberIndex) {
                const avatarClass = avatarClasses[memberIndex % avatarClasses.length];

                return `<span class="${avatarClass}">${escapeHTML(member)}</span>`;
            }).join("");

            return `
                <div class="ev e-${color}"
                     data-event-id="${escapeHTML(event.id)}"
                     style="top:${top}px;height:${height}px">
                    <div>
                        <span class="time">
                            <svg viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="9"/>
                                <path d="M12 7v5l3 2"/>
                            </svg>
                            ${formatTime(event.startTime)} - ${formatTime(event.endTime)}
                        </span>
                        <h4>${escapeHTML(event.title)}</h4>
                    </div>
                    <div class="bt">
                        <span>${escapeHTML(event.location || "No location")}</span>
                        <div class="avatars">${avatarsHTML}</div>
                    </div>
                </div>
            `;
        }).join("");

        const emptyHTML = events.length === 0
            ? '<p class="calendar-empty-message">No events scheduled for this day.</p>'
            : "";

        timeline.style.height = `${(END_HOUR - START_HOUR) * HOUR_HEIGHT + 20}px`;

        timeline.innerHTML = hoursHTML.join("") + eventHTML + emptyHTML;
    }

    function renderCalendar() {
        renderMonth();
        renderWeek();
        renderTimeline();
    }

    // Shared calendar API for the integration layer
    window.ProductivityCalendar = {
        getSelectedDate: function () {
            return dateKey(selectedDate);
        },
        render: function () {
            renderCalendar();
        },
        setSelectedDate: function (value) {
            const parts = String(value).split("-").map(Number);

            if (
                parts.length !== 3 ||
                parts.some(Number.isNaN)
            ) return;

            selectedDate = new Date(parts[0], parts[1] - 1, parts[2]);
            renderCalendar();
        }
    };
    weekContainer.addEventListener("click", function (event) {
        const day = event.target.closest(".day");

        if (!day || !day.dataset.date) return;

        const parts = day.dataset.date.split("-").map(Number);
        selectedDate = new Date(parts[0], parts[1] - 1, parts[2]);

        renderCalendar();
    });

    function moveSelectedWeek(offset) {
        selectedDate.setDate(selectedDate.getDate() + offset * 7);
        renderCalendar();
    }

    if (previousWeekButton) {
        previousWeekButton.addEventListener("click", function () {
            moveSelectedWeek(-1);
        });
    }

    if (nextWeekButton) {
        nextWeekButton.addEventListener("click", function () {
            moveSelectedWeek(1);
        });
    }

    renderCalendar();

    window.addEventListener("storage", function (event) {
        if (event.key === "productivity_events") {
            renderTimeline();
        }
    });
});


