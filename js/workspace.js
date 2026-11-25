(() => {
  "use strict";
  const KEYS = { projects:"productivity_projects", tasks:"productivity_tasks", events:"productivity_events", settings:"productivity_settings", comments:"productivity_task_comments", profile:"productivity_profile" };
  const read = (key, fallback) => { try { const v=localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; } };
  const write = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch(e) { console.error(e); toast("Storage is full. Remove large attachments or export a backup."); return false; } };
  const uid = prefix => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const today = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
  const fmt = value => value ? new Date(value+"T00:00:00").toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"}) : "No date";
  const $ = id => document.getElementById(id);
  let activeView = "dashboard";
  let toastTimer;

  function toast(message) { const el=$("toast"); el.textContent=message; el.style.display="block"; clearTimeout(toastTimer); toastTimer=setTimeout(()=>el.style.display="none",2600); }
  function projects(){ return read(KEYS.projects,[]); }
  function tasks(){ return read(KEYS.tasks,[]); }
  function events(){ return read(KEYS.events,[]); }
  function profile(){ return read(KEYS.profile,{name:"Kunal Khare",email:"",role:"",reminder:"1",dailySummary:true}); }
  function comments(){ return read(KEYS.comments,{}); }
  function saveProjects(v){return write(KEYS.projects,v);}
  function saveTasks(v){return write(KEYS.tasks,v);}
  function saveEvents(v){return write(KEYS.events,v);}
  function normalizeTask(t){ return {...t, title:t.title||t.name||"Untitled task", status:t.status==="Completed"?"Complete":(t.status||"To Do"), priority:t.priority||"Medium", assignee:t.assignee||"", description:t.description||"", dueDate:t.dueDate||"", subtasks:Array.isArray(t.subtasks)?t.subtasks:[], attachments:Array.isArray(t.attachments)?t.attachments:[]}; }
  function syncProjectProgress(){
    const all=tasks().map(normalizeTask);
    const updated=projects().map(p=>{
      const linked=all.filter(t=>String(t.projectId)===String(p.id));
      const total=linked.length || Number(p.totalTasks)||0;
      const done=linked.length ? linked.filter(t=>t.status==="Complete").length : Number(p.completedTasks)||0;
      const progress=linked.length ? Math.round(done/linked.length*100) : Number(p.progress)||0;
      return {...p,totalTasks:total,completedTasks:done,progress,status:linked.length ? (done===linked.length?"Completed":(done>0?"In Progress":(p.status==="On Hold"?"On Hold":"Not Started"))) : (p.status||"Not Started")};
    });
    saveProjects(updated);
  }
  function projectName(id){return projects().find(p=>String(p.id)===String(id))?.name || "No project";}
  function empty(text){return `<div class="empty-state">${esc(text)}</div>`;}
  function priorityClass(p){return String(p||"Medium").toLowerCase();}
  function showView(view){
    activeView=view;
    document.querySelectorAll(".view").forEach(v=>v.classList.toggle("active",v.id===view+"View"));
    document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
    const titles={dashboard:"Dashboard",projects:"Projects",tasks:"Tasks",calendar:"Calendar",notifications:"Notifications",profile:"My Profile"};
    $("pageTitle").textContent=titles[view]||"Dashboard";
    renderAll();
  }
  function projectCard(p){
    const linked=tasks().map(normalizeTask).filter(t=>String(t.projectId)===String(p.id));
    const done=linked.filter(t=>t.status==="Complete").length;
    const count=linked.length || Number(p.totalTasks)||0;
    const pct=linked.length?Math.round(done/linked.length*100):Number(p.progress)||0;
    return `<article class="item-card"><div class="item-top"><div><h4>${esc(p.name)}</h4><p>${esc(p.description||"No description")}</p></div><span class="pill ${priorityClass(p.priority)}">${esc(p.priority||"Medium")}</span></div><div class="item-meta"><span class="pill">${esc(p.status||"Not Started")}</span><span class="pill">Due ${esc(fmt(p.dueDate))}</span><span class="pill">${(p.members||[]).length} members</span></div><div class="progress-track"><i style="width:${pct}%"></i></div><p>${done} of ${count} tasks completed · ${pct}%</p><div class="item-actions"><button class="small-button" data-action="project-edit" data-id="${esc(p.id)}">Edit</button><button class="small-button" data-action="project-tasks" data-id="${esc(p.id)}">View tasks</button><button class="small-button danger" data-action="project-delete" data-id="${esc(p.id)}">Delete</button></div></article>`;
  }
  function taskCard(t){
    const due=t.dueDate ? fmt(t.dueDate) : "No due date";
    const overdue=t.dueDate && t.dueDate<today() && t.status!=="Complete";
    return `<article class="item-card"><div class="item-top"><div><h4>${esc(t.title)}</h4><p>${esc(projectName(t.projectId))} · ${esc(t.assignee||"Unassigned")}</p></div><span class="pill ${priorityClass(t.priority)}">${esc(t.priority)}</span></div><div class="item-meta"><span class="pill">${esc(t.status)}</span><span class="pill ${overdue?"high":""}">${overdue?"Overdue · ":""}${esc(due)}</span></div><div class="item-actions"><button class="small-button" data-action="task-detail" data-id="${esc(t.id)}">Details</button><button class="small-button" data-action="task-edit" data-id="${esc(t.id)}">Edit</button><button class="small-button danger" data-action="task-delete" data-id="${esc(t.id)}">Delete</button></div></article>`;
  }
  function eventCard(e){
    return `<article class="item-card"><div class="item-top"><div><h4>${esc(e.title)}</h4><p>${esc(projectName(e.projectId))} · ${esc(e.location||"No location")}</p></div><span class="pill">${esc(e.startTime)}–${esc(e.endTime)}</span></div><div class="item-meta"><span class="pill">${esc(fmt(e.date))}</span></div><div class="item-actions"><button class="small-button" data-action="event-edit" data-id="${esc(e.id)}">Edit</button><button class="small-button danger" data-action="event-delete" data-id="${esc(e.id)}">Delete</button></div></article>`;
  }
  function renderDashboard(){
    const ps=projects(), ts=tasks().map(normalizeTask), es=events();
    const open=ts.filter(t=>t.status!=="Complete").length, done=ts.filter(t=>t.status==="Complete").length;
    $("dashboardStats").innerHTML=[["Projects",ps.length],["Open tasks",open],["Completed",done],["Events",es.length]].map(([label,n])=>`<div class="metric"><span>${label}</span><strong>${n}</strong></div>`).join("");
    $("dashboardProjects").innerHTML=ps.length?ps.slice(0,4).map(projectCard).join(""):empty("Create your first project to get started.");
    const upcoming=ts.filter(t=>t.status!=="Complete"&&t.dueDate).sort((a,b)=>a.dueDate.localeCompare(b.dueDate)).slice(0,5);
    $("upcomingTasks").innerHTML=upcoming.length?upcoming.map(taskCard).join(""):empty("No upcoming task deadlines.");
  }
  function renderProjects(){
    const q=$("projectSearch").value.toLowerCase(), status=$("projectStatusFilter").value, priority=$("projectPriorityFilter").value;
    const list=projects().filter(p=>(!q||(`${p.name} ${p.description||""}`).toLowerCase().includes(q))&&(!status||p.status===status)&&(!priority||p.priority===priority));
    $("projectsList").innerHTML=list.length?list.map(projectCard).join(""):empty("No matching projects.");
  }
  function renderTasks(){
    const q=$("globalSearch").value.toLowerCase(), status=$("taskStatusFilter").value, priority=$("taskPriorityFilter").value, date=$("taskDateFilter").value;
    const list=tasks().map(normalizeTask).filter(t=>(!q||(`${t.title} ${t.description} ${projectName(t.projectId)} ${t.assignee}`).toLowerCase().includes(q))&&(!status||t.status===status)&&(!priority||t.priority===priority)&&(!date||t.dueDate===date)).sort((a,b)=>(a.dueDate||"9999").localeCompare(b.dueDate||"9999"));
    $("tasksList").innerHTML=list.length?list.map(taskCard).join(""):empty("No matching tasks. Use + Task to create one.");
  }
  function renderCalendar(){
    const date=$("calendarDate").value||today(); $("calendarDate").value=date;
    const list=events().filter(e=>e.date===date).sort((a,b)=>a.startTime.localeCompare(b.startTime));
    $("calendarSummary").textContent=new Date(date+"T00:00:00").toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric",year:"numeric"})+" · "+list.length+" event(s)";
    $("eventsList").innerHTML=list.length?list.map(eventCard).join(""):empty("No events on this date.");
  }
  function buildNotifications(){
    const p=profile(), days=Number(p.reminder)||0, now=today(), notes=[];
    tasks().map(normalizeTask).filter(t=>t.status!=="Complete"&&t.dueDate).forEach(t=>{
      const diff=Math.round((new Date(t.dueDate+"T00:00:00")-new Date(now+"T00:00:00"))/86400000);
      if(diff<0) notes.push({date:t.dueDate,title:"Overdue task",body:`${t.title} was due ${fmt(t.dueDate)}.`});
      else if(diff===0) notes.push({date:t.dueDate,title:"Task due today",body:`${t.title} is due today.`});
      else if(days&&diff<=days) notes.push({date:t.dueDate,title:"Upcoming task",body:`${t.title} is due in ${diff} day(s).`});
    });
    events().filter(e=>e.date>=now).forEach(e=>{const diff=Math.round((new Date(e.date+"T00:00:00")-new Date(now+"T00:00:00"))/86400000); if(diff<=days) notes.push({date:e.date,title:"Upcoming event",body:`${e.title} · ${e.startTime}`});});
    return notes.sort((a,b)=>a.date.localeCompare(b.date));
  }
  function renderNotifications(){
    const notes=buildNotifications();
    $("notificationsList").innerHTML=notes.length?notes.map(n=>`<article class="item-card"><div class="item-top"><h4>${esc(n.title)}</h4><span class="pill">${esc(fmt(n.date))}</span></div><p>${esc(n.body)}</p></article>`).join(""):empty("You're all caught up. No reminders right now.");
    $("notificationDot").style.display=notes.length?"block":"none";
  }
  function renderProfile(){
    const p=profile(), form=$("profileForm");
    $("profileDisplayName").textContent=p.name||"Your name"; $("profileDisplayEmail").textContent=p.email||"Local profile";
    const initial=(p.name||"K").trim().charAt(0).toUpperCase();
    $("profileBigAvatar").textContent=initial;
    $("profileShortcut").textContent=initial;
    if(p.avatar){
      [$("profileBigAvatar"),$("profileShortcut")].forEach(el=>{
        const image=document.createElement("img");image.src=p.avatar;image.alt="Profile picture";el.textContent="";el.appendChild(image);
      });
    }
    form.elements.name.value=p.name||""; form.elements.email.value=p.email||""; form.elements.role.value=p.role||""; form.elements.reminder=p.reminder||"1"; form.elements.dailySummary.checked=!!p.dailySummary;
    $("greeting").textContent=`Welcome back, ${(p.name||"there").split(" ")[0]}`;
  }
  function renderAll(){
    syncProjectProgress();
    if(activeView==="dashboard")renderDashboard();
    if(activeView==="projects")renderProjects();
    if(activeView==="tasks")renderTasks();
    if(activeView==="calendar")renderCalendar();
    if(activeView==="notifications")renderNotifications();
    if(activeView==="profile")renderProfile();
    if(activeView!=="notifications")renderNotifications();
  }
  function openModal(title,body){
    $("modalTitle").textContent=title; $("modalBody").innerHTML=body; $("modalBackdrop").hidden=false;
    $("modalPanel")?.scrollTo(0,0);
  }
  function closeModal(){$("modalBackdrop").hidden=true;$("modalBody").innerHTML="";}
  function projectOptions(selected){
    return `<option value="">Select project</option>`+projects().map(p=>`<option value="${esc(p.id)}" ${String(p.id)===String(selected)?"selected":""}>${esc(p.name)}</option>`).join("");
  }
  function projectForm(p={}){
    openModal(p.id?"Edit project":"Create project",`<form class="modal-form" id="projectForm">
      <label>Project name<input name="name" required maxlength="100" value="${esc(p.name||"")}"></label>
      <label>Description<textarea name="description">${esc(p.description||"")}</textarea></label>
      <label>Priority<select name="priority">${["Low","Medium","High"].map(v=>`<option ${p.priority===v?"selected":""}>${v}</option>`).join("")}</select></label>
      <label>Status<select name="status">${["Not Started","In Progress","On Hold","Completed"].map(v=>`<option ${p.status===v?"selected":""}>${v}</option>`).join("")}</select></label>
      <label>Start date<input type="date" name="startDate" value="${esc(p.startDate||today())}" required></label>
      <label>Due date<input type="date" name="dueDate" value="${esc(p.dueDate||"")}" required></label>
      <label>Team members (comma separated)<input name="members" value="${esc((p.members||[]).join(", "))}" placeholder="Kunal, Alex, Sam"></label>
      <div class="form-actions"><button type="button" class="secondary-button" data-close>Cancel</button><button class="primary-button" type="submit">Save project</button></div>
    </form>`);
    $("projectForm").addEventListener("submit",e=>{
      e.preventDefault();const f=e.currentTarget, d=new FormData(f), start=d.get("startDate"), due=d.get("dueDate");
      if(due<start){toast("Due date cannot be before start date.");return;}
      const all=projects(), value={id:p.id||uid("project"),name:d.get("name").trim(),description:d.get("description").trim(),priority:d.get("priority"),status:d.get("status"),startDate:start,dueDate:due,members:String(d.get("members")).split(",").map(x=>x.trim()).filter(Boolean),attachments:p.attachments||[],comments:p.comments||0,subtasks:p.subtasks||[]};
      const next=p.id?all.map(x=>String(x.id)===String(p.id)?{...x,...value}:x):[...all,value];
      if(saveProjects(next)){closeModal();renderAll();toast(p.id?"Project updated.":"Project created.");}
    });
  }
  function taskForm(t={}){
    const x=normalizeTask(t), isEdit=!!t.id;
    openModal(isEdit?"Edit task":"Create task",`<form class="modal-form" id="taskForm">
      <label>Task title<input name="title" required maxlength="140" value="${esc(x.title==="Untitled task"?"":x.title)}"></label>
      <label>Project<select name="projectId" required>${projectOptions(x.projectId)}</select></label>
      <label>Description<textarea name="description">${esc(x.description)}</textarea></label>
      <label>Assignee<input name="assignee" value="${esc(x.assignee)}" placeholder="Team member name"></label>
      <label>Priority<select name="priority">${["Low","Medium","High"].map(v=>`<option ${x.priority===v?"selected":""}>${v}</option>`).join("")}</select></label>
      <label>Status<select name="status">${["To Do","In Progress","In Review","Complete"].map(v=>`<option ${x.status===v?"selected":""}>${v}</option>`).join("")}</select></label>
      <label>Due date<input name="dueDate" type="date" value="${esc(x.dueDate)}"></label>
      <div class="form-actions"><button type="button" class="secondary-button" data-close>Cancel</button><button class="primary-button" type="submit">Save task</button></div>
    </form>`);
    $("taskForm").addEventListener("submit",e=>{
      e.preventDefault();const d=new FormData(e.currentTarget), all=tasks();
      const value={...x,id:t.id||uid("task"),projectId:d.get("projectId"),title:d.get("title").trim(),description:d.get("description").trim(),assignee:d.get("assignee").trim(),priority:d.get("priority"),status:d.get("status"),dueDate:d.get("dueDate"),subtasks:x.subtasks,attachments:x.attachments};
      const next=t.id?all.map(v=>String(v.id)===String(t.id)?value:v):[...all,value];
      if(saveTasks(next)){closeModal();renderAll();toast(t.id?"Task updated.":"Task created.");}
    });
  }
  function eventForm(e={}){
    openModal(e.id?"Edit event":"Create event",`<form class="modal-form" id="eventForm">
      <label>Event title<input name="title" required value="${esc(e.title||"")}"></label>
      <label>Project<select name="projectId">${projectOptions(e.projectId)}</select></label>
      <label>Date<input type="date" name="date" required value="${esc(e.date||$("calendarDate").value||today())}"></label>
      <label>Start time<input type="time" name="startTime" required value="${esc(e.startTime||"09:00")}"></label>
      <label>End time<input type="time" name="endTime" required value="${esc(e.endTime||"10:00")}"></label>
      <label>Location<input name="location" value="${esc(e.location||"")}"></label>
      <label>Related task<select name="taskId"><option value="">None</option>${tasks().map(t=>`<option value="${esc(t.id)}" ${String(t.id)===String(e.taskId)?"selected":""}>${esc(t.title||t.name)}</option>`).join("")}</select></label>
      <div class="form-actions"><button type="button" class="secondary-button" data-close>Cancel</button><button class="primary-button" type="submit">Save event</button></div>
    </form>`);
    $("eventForm").addEventListener("submit",ev=>{
      ev.preventDefault();const d=new FormData(ev.currentTarget);if(d.get("endTime")<=d.get("startTime")){toast("End time must be after start time.");return;}
      const all=events(), value={id:e.id||uid("event"),title:d.get("title").trim(),projectId:d.get("projectId"),taskId:d.get("taskId"),date:d.get("date"),startTime:d.get("startTime"),endTime:d.get("endTime"),location:d.get("location").trim(),color:e.color||"lav"};
      if(saveEvents(e.id?all.map(v=>v.id===e.id?value:v):[...all,value])){closeModal();$("calendarDate").value=value.date;showView("calendar");toast(e.id?"Event updated.":"Event created.");}
    });
  }
  function taskDetail(id){
    const t=tasks().map(normalizeTask).find(v=>String(v.id)===String(id));if(!t)return;
    const cs=comments(), list=cs[id]||[];
    openModal("Task details",`<article><h3>${esc(t.title)}</h3><p>${esc(t.description||"No description")}</p><div class="item-meta"><span class="pill">${esc(t.status)}</span><span class="pill ${priorityClass(t.priority)}">${esc(t.priority)}</span><span class="pill">${esc(projectName(t.projectId))}</span></div><p>Assignee: ${esc(t.assignee||"Unassigned")} · Due: ${esc(fmt(t.dueDate))}</p>
      <div class="detail-block"><h4>Subtasks (${t.subtasks.length})</h4><div id="subtaskList">${t.subtasks.map((s,i)=>`<label class="comment"><input type="checkbox" data-subtask="${i}" ${s.done?"checked":""}> ${esc(s.title)}</label>`).join("")||empty("No subtasks yet.")}</div><form id="subtaskForm" class="modal-form" style="margin-top:8px"><label>Add subtask<input name="title" required placeholder="Subtask title"></label><button class="secondary-button" type="submit">Add subtask</button></form></div>
      <div class="detail-block"><h4>Attachments (${t.attachments.length})</h4><div>${t.attachments.map(a=>`<div class="comment">${esc(a.name)} · ${esc(a.size)} <a href="${esc(a.data||"#")}" ${a.data?'download="'+esc(a.name)+'"':""}>${a.data?"Download":"File"}</a></div>`).join("")||empty("No attachments.")}</div><label class="secondary-button file-button" style="margin-top:8px">Add attachment<input type="file" id="taskAttachment" multiple></label><p>For browser storage reliability, keep each file under 700 KB.</p></div>
      <div class="detail-block"><h4>Comments (${list.length})</h4><div id="commentList">${list.map(c=>`<div class="comment">${esc(c.text)}<small>${esc(c.author||profile().name)} · ${esc(c.date)}</small></div>`).join("")||empty("No comments yet.")}</div><form id="commentForm" class="modal-form" style="margin-top:8px"><label>Add comment<textarea name="text" required></textarea></label><button class="secondary-button" type="submit">Post comment</button></form></div>
      <div class="item-actions"><button class="small-button" data-action="task-edit" data-id="${esc(t.id)}">Edit task</button><button class="small-button" data-close>Close</button></div></article>`);
    $("subtaskForm").addEventListener("submit",e=>{e.preventDefault();const title=new FormData(e.currentTarget).get("title").trim();updateTask(id,v=>({...v,subtasks:[...v.subtasks,{title,done:false}]}));taskDetail(id);});
    $("subtaskList").addEventListener("change",e=>{if(e.target.matches("[data-subtask]")){const i=Number(e.target.dataset.subtask);updateTask(id,v=>({...v,subtasks:v.subtasks.map((s,j)=>j===i?{...s,done:e.target.checked}:s)}));taskDetail(id);}});
    $("commentForm").addEventListener("submit",e=>{e.preventDefault();const text=new FormData(e.currentTarget).get("text").trim();const all=comments();all[id]=[...(all[id]||[]),{text,author:profile().name,date:new Date().toLocaleString()}];if(write(KEYS.comments,all))taskDetail(id);});
    $("taskAttachment").addEventListener("change",async e=>{const files=[...e.target.files];for(const file of files){if(file.size>700*1024){toast(`${file.name} exceeds 700 KB.`);continue;}const data=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file);});updateTask(id,v=>({...v,attachments:[...v.attachments,{name:file.name,size:Math.ceil(file.size/1024)+" KB",data}]}));}taskDetail(id);});
  }
  function updateTask(id,fn){const all=tasks().map(normalizeTask);const next=all.map(t=>String(t.id)===String(id)?fn(t):t);saveTasks(next);renderAll();}
  function deleteProject(id){
    const p=projects().find(v=>String(v.id)===String(id));if(!p||!confirm(`Delete "${p.name}" and its linked tasks and events?`))return;
    if(!saveProjects(projects().filter(v=>String(v.id)!==String(id))))return;
    saveTasks(tasks().filter(t=>String(t.projectId)!==String(id)));saveEvents(events().filter(e=>String(e.projectId)!==String(id)));
    toast("Project and linked records deleted.");renderAll();
  }
  function deleteTask(id){if(!confirm("Delete this task?"))return;saveTasks(tasks().filter(t=>String(t.id)!==String(id)));saveEvents(events().map(ev=>String(ev.taskId)===String(id)?{...ev,taskId:""}:ev));const c=comments();delete c[id];write(KEYS.comments,c);renderAll();toast("Task deleted.");}
  function deleteEvent(id){if(!confirm("Delete this event?"))return;saveEvents(events().filter(e=>String(e.id)!==String(id)));renderAll();toast("Event deleted.");}
  document.addEventListener("click",e=>{
    const view=e.target.closest("[data-view]");if(view){showView(view.dataset.view);return;}
    const close=e.target.closest("[data-close]");if(close){closeModal();return;}
    const b=e.target.closest("[data-action]");if(!b)return;
    const id=b.dataset.id, action=b.dataset.action;
    if(action==="project-edit")projectForm(projects().find(p=>String(p.id)===String(id)));
    if(action==="project-delete")deleteProject(id);
    if(action==="project-tasks"){$("globalSearch").value="";showView("tasks");const select=$("taskStatusFilter");select.value="";$("tasksList").innerHTML=tasks().map(normalizeTask).filter(t=>String(t.projectId)===String(id)).map(taskCard).join("")||empty("No tasks for this project.");}
    if(action==="task-edit")taskForm(tasks().map(normalizeTask).find(t=>String(t.id)===String(id)));
    if(action==="task-detail")taskDetail(id);
    if(action==="task-delete")deleteTask(id);
    if(action==="event-edit")eventForm(events().find(v=>String(v.id)===String(id)));
    if(action==="event-delete")deleteEvent(id);
  });
  $("closeModal").addEventListener("click",closeModal);
  $("modalBackdrop").addEventListener("click",e=>{if(e.target===$("modalBackdrop"))closeModal();});
  document.addEventListener("keydown",e=>{if(e.key==="Escape")closeModal();});
  $("addProjectBtn").addEventListener("click",()=>projectForm());
  $("addTaskBtn").addEventListener("click",()=>{if(!projects().length){toast("Create a project before adding tasks.");showView("projects");return;}taskForm();});
  $("addEventBtn").addEventListener("click",()=>eventForm());
  $("projectSearch").addEventListener("input",renderProjects);$("projectStatusFilter").addEventListener("change",renderProjects);$("projectPriorityFilter").addEventListener("change",renderProjects);
  $("globalSearch").addEventListener("input",renderTasks);$("taskStatusFilter").addEventListener("change",renderTasks);$("taskPriorityFilter").addEventListener("change",renderTasks);$("taskDateFilter").addEventListener("change",renderTasks);$("calendarDate").addEventListener("change",renderCalendar);
  $("profileShortcut").addEventListener("click",()=>{window.location.href="profile.html";});
  $("profileForm").addEventListener("submit",e=>{e.preventDefault();const d=new FormData(e.currentTarget);const value={name:d.get("name").trim(),email:d.get("email").trim(),role:d.get("role").trim(),reminder:d.get("reminder"),dailySummary:d.get("dailySummary")==="on"};if(write(KEYS.profile,value)){renderProfile();toast("Profile and preferences saved.");}});
  $("enableNotifications").addEventListener("click",async()=>{if(!("Notification" in window)){toast("Browser notifications are not supported here.");return;}const result=await Notification.requestPermission();toast(result==="granted"?"Browser notifications enabled.":"Notification permission not granted.");});
  $("exportDataBtn").addEventListener("click",()=>{const data={projects:projects(),tasks:tasks(),events:events(),comments:comments(),profile:profile(),settings:read(KEYS.settings,{})};const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="productivity-backup-"+today()+".json";a.click();URL.revokeObjectURL(url);});
  $("importDataInput").addEventListener("change",async e=>{const file=e.target.files[0];if(!file)return;try{const data=JSON.parse(await file.text());if(!Array.isArray(data.projects)||!Array.isArray(data.tasks)||!Array.isArray(data.events))throw new Error("Invalid backup format");if(!confirm("Import will replace current projects, tasks and events. Continue?"))return;saveProjects(data.projects);saveTasks(data.tasks);saveEvents(data.events);write(KEYS.comments,data.comments||{});if(data.profile)write(KEYS.profile,data.profile);renderAll();toast("Backup imported.");}catch(err){toast("Could not import this backup: "+err.message);}e.target.value="";});
  function runBrowserReminders(){
    if(!("Notification" in window)||Notification.permission!=="granted")return;
    const notes=buildNotifications().filter(n=>n.date===today());
    const sent=read("productivity_notified_today",{});
    notes.forEach(n=>{const key=today()+n.title+n.body;if(!sent[key]){new Notification(n.title,{body:n.body});sent[key]=true;}});
    write("productivity_notified_today",sent);
  }
  // Seed profile only; existing project/task/event records are intentionally preserved.
  if(!localStorage.getItem(KEYS.profile))write(KEYS.profile,profile());
  if(!localStorage.getItem(KEYS.tasks))write(KEYS.tasks,[]);
  if(!localStorage.getItem(KEYS.projects))write(KEYS.projects,[]);
  if(!localStorage.getItem(KEYS.events))write(KEYS.events,[]);
  $("calendarDate").value=today();
  renderProfile();
  const requestedView=window.location.hash.slice(1);
  showView(["projects","tasks","calendar","notifications","profile"].includes(requestedView)?requestedView:"dashboard");
  runBrowserReminders();
  window.addEventListener("storage",renderAll);
})();