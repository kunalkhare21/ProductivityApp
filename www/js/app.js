(function () {
    function dateOffset(days) {
        const date = new Date();
        date.setDate(date.getDate() + days);
        return [
            date.getFullYear(),
            String(date.getMonth() + 1).padStart(2, "0"),
            String(date.getDate()).padStart(2, "0")
        ].join("-");
    }

    const settings = Storage.getSettings();

    function refreshExistingSampleData() {
        if (settings.dashboardSampleV2) return;

        const projects = Storage.getProjects();
        const tasks = Storage.getTasks();
        const firstProject = projects.find(function (project) {
            return project.id === "project-1" && project.name === "Smart Personal Finance Tracker App";
        });
        const learningProject = projects.find(function (project) {
            return project.id === "project-2" && project.name === "AI-Powered Learning Platform";
        });
        const firstTask = tasks.find(function (task) {
            return task.id === "task-1" &&
                task.title === "Design System & Component Library" &&
                task.projectId === "project-1" &&
                task.status === "To Do" &&
                task.dueDate === "2025-09-17";
        });
        const secondTask = tasks.find(function (task) {
            return task.id === "task-2" &&
                task.title === "Onboarding Flow Prototype" &&
                task.projectId === "project-1" &&
                task.status === "To Do" &&
                task.dueDate === "2025-09-18";
        });

        if (!firstProject || !learningProject || !firstTask || !secondTask ||
            firstProject.status !== "In Progress" ||
            firstProject.progress !== 75 ||
            firstProject.totalTasks !== 12 ||
            firstProject.completedTasks !== 9 ||
            learningProject.status !== "In Progress" ||
            learningProject.progress !== 60 ||
            learningProject.totalTasks !== 10 ||
            learningProject.completedTasks !== 6) {
            return;
        }

        firstTask.projectId = "project-2";
        firstTask.title = "Build the AI lesson dashboard";
        firstTask.status = "In Progress";
        firstTask.dueDate = dateOffset(1);
        secondTask.dueDate = dateOffset(2);

        if (firstProject.startDate === "2025-08-28") firstProject.startDate = dateOffset(0);
        if (firstProject.dueDate === "2025-09-13") firstProject.dueDate = dateOffset(14);
        if (firstProject.status === "In Progress") firstProject.status = "Not Started";
        if (learningProject.startDate === "2025-09-01") learningProject.startDate = dateOffset(0);
        if (learningProject.dueDate === "2025-09-30") learningProject.dueDate = dateOffset(14);
        firstProject.totalTasks = 1;
        firstProject.completedTasks = 0;
        firstProject.progress = 0;
        learningProject.totalTasks = 1;
        learningProject.completedTasks = 0;
        learningProject.progress = 0;
        if (Array.isArray(firstProject.attachments) && firstProject.attachments.length === 2 &&
            firstProject.attachments.every(function (attachment) {
                return !attachment.data &&
                    (attachment.name === "UX-userflow-finance.png" || attachment.name === "Brief-finance.pdf");
            })) {
            firstProject.attachments = [];
        }

        const saved = [
            Storage.saveTasks(tasks),
            Storage.saveProjects(projects)
        ];
        if (!saved.every(Boolean)) {
            console.error("Could not refresh the original sample project and task data.");
            return;
        }

        if (!Storage.saveSettings(Object.assign({}, settings, { dashboardSampleV2: true }))) {
            console.error("Could not mark the sample data refresh as complete.");
        }
    }

    if (settings.initialDataCreated) {
        refreshExistingSampleData();
        console.log("Productivity App data already initialized.");
        return;
    }

    const projects = [
        {
            id: "project-1",
            name: "Smart Personal Finance Tracker App",
            priority: "High",
            status: "Not Started",
            startDate: dateOffset(0),
            dueDate: dateOffset(14),
            description: "Develop and implement core application features, including advanced secure authentication systems, automated expense tracking capabilities, and personalized financial insights to enhance user experience and engagement.",
            progress: 0,
            totalTasks: 1,
            completedTasks: 0,
            members: ["K", "S", "R"],
            comments: 0,
            attachments: [],
            subtasks: [
                "Conduct user interviews to understand financial habits",
                "Define key user personas and journey maps",
                "Analyze competitor finance apps for feature gaps"
            ]
        },
        {
            id: "project-2",
            name: "AI-Powered Learning Platform",
            priority: "High",
            status: "In Progress",
            startDate: dateOffset(0),
            dueDate: dateOffset(14),
            description: "Build an AI-powered learning platform.",
            progress: 0,
            totalTasks: 1,
            completedTasks: 0,
            members: ["A", "J", "L", "T"],
            comments: 0,
            attachments: [],
            subtasks: []
        }
    ];

    const tasks = [
        {
            id: "task-1",
            projectId: "project-2",
            title: "Build the AI lesson dashboard",
            priority: "High",
            status: "In Progress",
            dueDate: dateOffset(1)
        },
        {
            id: "task-2",
            projectId: "project-1",
            title: "Onboarding Flow Prototype",
            status: "To Do",
            priority: "Medium",
            dueDate: dateOffset(2)
        }
    ];

    const events = [
        {
            id: "event-1",
            projectId: "project-1",
            title: "Update Product Roadmap",
            date: dateOffset(1),
            startTime: "09:00",
            endTime: "10:00",
            location: "Online - Zoom meeting",
            color: "lav"
        },
        {
            id: "event-2",
            projectId: "project-1",
            title: "UI/UX Research for New Feature",
            date: dateOffset(1),
            startTime: "10:00",
            endTime: "11:00",
            location: "Online - Zoom meeting",
            color: "mint"
        },
        {
            id: "event-3",
            projectId: "project-1",
            title: "Wireframing & Initial UI Design Finance",
            date: dateOffset(1),
            startTime: "11:00",
            endTime: "12:00",
            location: "WFH - Daily task",
            color: "peach"
        },
        {
            id: "event-4",
            projectId: "project-1",
            title: "Discuss & Feedback Wireframing UI Design Finance",
            date: dateOffset(1),
            startTime: "12:30",
            endTime: "13:30",
            location: "WFH - Daily task",
            color: "pink"
        },
        {
            id: "event-5",
            projectId: "project-1",
            title: "Sprint Review & Planning",
            date: dateOffset(1),
            startTime: "13:30",
            endTime: "14:40",
            location: "Online - Zoom meeting",
            color: "lav"
        }
    ];

    const saved = [
        Storage.saveProjects(projects),
        Storage.saveTasks(tasks),
        Storage.saveEvents(events)
    ];

    if (saved.every(Boolean)) {
        Storage.saveSettings({
            ...settings,
            initialDataCreated: true
        });

        console.log("Productivity App sample data initialized successfully.");
    } else {
        console.error("Could not initialize all sample data.");
    }
})();
