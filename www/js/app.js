(function () {
    const settings = Storage.getSettings();

    if (settings.initialDataCreated) {
        console.log("Productivity App data already initialized.");
        return;
    }

    const projects = [
        {
            id: "project-1",
            name: "Smart Personal Finance Tracker App",
            priority: "High",
            status: "In Progress",
            startDate: "2025-08-28",
            dueDate: "2025-09-13",
            description: "Develop and implement core application features, including advanced secure authentication systems, automated expense tracking capabilities, and personalized financial insights to enhance user experience and engagement.",
            progress: 75,
            totalTasks: 12,
            completedTasks: 9,
            members: ["K", "S", "R"],
            comments: 8,
            attachments: [
                {
                    name: "UX-userflow-finance.png",
                    size: "2.5 MB",
                    type: "image"
                },
                {
                    name: "Brief-finance.pdf",
                    size: "12.0 MB",
                    type: "pdf"
                }
            ],
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
            startDate: "2025-09-01",
            dueDate: "2025-09-30",
            description: "Build an AI-powered learning platform.",
            progress: 60,
            totalTasks: 10,
            completedTasks: 6,
            members: ["A", "J", "L", "T"],
            comments: 0,
            attachments: [],
            subtasks: []
        }
    ];

    const tasks = [
        {
            id: "task-1",
            projectId: "project-1",
            title: "Design System & Component Library",
            status: "To Do",
            priority: "High",
            dueDate: "2025-09-17"
        },
        {
            id: "task-2",
            projectId: "project-1",
            title: "Onboarding Flow Prototype",
            status: "To Do",
            priority: "Medium",
            dueDate: "2025-09-18"
        }
    ];

    const events = [
        {
            id: "event-1",
            projectId: "project-1",
            title: "Update Product Roadmap",
            date: "2025-09-17",
            startTime: "09:00",
            endTime: "10:00",
            location: "Online - Zoom meeting",
            color: "lav"
        },
        {
            id: "event-2",
            projectId: "project-1",
            title: "UI/UX Research for New Feature",
            date: "2025-09-17",
            startTime: "10:00",
            endTime: "11:00",
            location: "Online - Zoom meeting",
            color: "mint"
        },
        {
            id: "event-3",
            projectId: "project-1",
            title: "Wireframing & Initial UI Design Finance",
            date: "2025-09-17",
            startTime: "11:00",
            endTime: "12:00",
            location: "WFH - Daily task",
            color: "peach"
        },
        {
            id: "event-4",
            projectId: "project-1",
            title: "Discuss & Feedback Wireframing UI Design Finance",
            date: "2025-09-17",
            startTime: "12:30",
            endTime: "13:30",
            location: "WFH - Daily task",
            color: "pink"
        },
        {
            id: "event-5",
            projectId: "project-1",
            title: "Sprint Review & Planning",
            date: "2025-09-17",
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
