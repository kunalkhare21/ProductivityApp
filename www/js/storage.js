const STORAGE_KEYS = {
    projects: "productivity_projects",
    tasks: "productivity_tasks",
    events: "productivity_events",
    settings: "productivity_settings",
    comments: "productivity_task_comments",
    profile: "productivity_profile",
    notifications: "productivity_notifications"
};

const Storage = {
    get(key, fallback = []) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : fallback;
        } catch (error) {
            console.error("Storage read error:", error);
            return fallback;
        }
    },

    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error("Storage save error:", error);
            return false;
        }
    },

    getProjects() {
        return this.get(STORAGE_KEYS.projects, []);
    },

    saveProjects(projects) {
        return this.set(STORAGE_KEYS.projects, projects);
    },

    getTasks() {
        return this.get(STORAGE_KEYS.tasks, []);
    },

    saveTasks(tasks) {
        return this.set(STORAGE_KEYS.tasks, tasks);
    },

    getEvents() {
        return this.get(STORAGE_KEYS.events, []);
    },

    saveEvents(events) {
        return this.set(STORAGE_KEYS.events, events);
    },

    getSettings() {
        return this.get(STORAGE_KEYS.settings, {});
    },

    saveSettings(settings) {
        return this.set(STORAGE_KEYS.settings, settings);
    },

    getTaskComments() {
        return this.get(STORAGE_KEYS.comments, {});
    },

    saveTaskComments(comments) {
        return this.set(STORAGE_KEYS.comments, comments);
    },

    getProfile() {
        return this.get(STORAGE_KEYS.profile, {
            name: "",
            email: "",
            avatar: ""
        });
    },

    saveProfile(profile) {
        return this.set(STORAGE_KEYS.profile, profile);
    },

    getNotifications() {
        return this.get(STORAGE_KEYS.notifications, []);
    },

    saveNotifications(notifications) {
        return this.set(STORAGE_KEYS.notifications, notifications);
    }
};

window.Storage = Storage;
