let events = JSON.parse(localStorage.getItem('events')) || [];
let todos = JSON.parse(localStorage.getItem('todos')) || [];
let startDate = new Date(); // Will be set to Sunday of current week
let currentFullscreenDay = null; // event-popup-v5: Track fullscreen day element
let darkMode = JSON.parse(localStorage.getItem('darkMode')) ?? true; // calendar-v5: Dark mode on by default

// calendar-v5: Toggle dark mode
function toggleDarkMode() {
    darkMode = !darkMode;
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    applyDarkMode();
}

// calendar-v5: Apply dark mode styles
function applyDarkMode() {
    const btn = document.getElementById('dark-mode-btn');
    if (darkMode) {
        document.body.classList.add('dark-mode');
        btn.textContent = 'Dark Mode: On';
    } else {
        document.body.classList.remove('dark-mode');
        btn.textContent = 'Dark Mode: Off';
    }
}

function saveData() {
    localStorage.setItem('events', JSON.stringify(events));
    localStorage.setItem('todos', JSON.stringify(todos));
}

function getDateString(date) {
    return date.toISOString().split('T')[0];
}

// event-popup-v5: Toggle fullscreen view for a day
function toggleFullscreen(dayDiv, dayStr, event) {
    event.stopPropagation();
    
    const backdrop = document.getElementById('fullscreen-backdrop');
    const toggleIcon = dayDiv.querySelector('.fullscreen-toggle');
    
    if (dayDiv.classList.contains('fullscreen')) {
        // Minimize
        dayDiv.classList.remove('fullscreen');
        backdrop.classList.remove('active');
        currentFullscreenDay = null;
        
        // Change icon back to maximize
        toggleIcon.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
            </svg>
        `;
        toggleIcon.title = "Expand";
    } else {
        // Maximize
        if (currentFullscreenDay) {
            currentFullscreenDay.classList.remove('fullscreen');
            const prevIcon = currentFullscreenDay.querySelector('.fullscreen-toggle');
            prevIcon.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
                </svg>
            `;
            prevIcon.title = "Expand";
        }
        dayDiv.classList.add('fullscreen');
        backdrop.classList.add('active');
        currentFullscreenDay = dayDiv;
        
        // Change icon to minimize
        toggleIcon.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"></path>
            </svg>
        `;
        toggleIcon.title = "Minimize";
    }
}

function processOverdueTodos() {
    // Calendar-v1: Removed auto-move logic - overdue is now determined at render time
    saveData();
}

function generateCalendar(start) {
    const calendar = document.getElementById('calendar');
    calendar.innerHTML = '';

    // Headers
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    days.forEach(day => {
        const header = document.createElement('div');
        header.className = 'day-header';
        header.textContent = day;
        calendar.appendChild(header);
    });

    // Set start to Sunday
    const startDay = new Date(start);
    startDay.setDate(startDay.getDate() - startDay.getDay());

    // Title
    const endDay = new Date(startDay);
    endDay.setDate(endDay.getDate() + 41); // 6 weeks
    document.getElementById('calendar-title').textContent = `${startDay.toDateString()} - ${endDay.toDateString()}`;

    for (let i = 0; i < 42; i++) {
        const day = new Date(startDay);
        day.setDate(day.getDate() + i);
        const dayStr = getDateString(day);

        const dayDiv = document.createElement('div');
        dayDiv.className = 'day';
        
        // event-popup-v5: Check if this is today and add current date styling
        const today = new Date();
        const todayStr = getDateString(today);
        const isToday = dayStr === todayStr;
        
        const dateClass = isToday ? 'date current-date' : 'date';
        dayDiv.innerHTML = `
            <div class="${dateClass}">${day.getDate()}</div>
            <div class="fullscreen-toggle" title="Expand">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
                </svg>
            </div>
        `;
        
        // event-popup-v5: Add fullscreen toggle click handler
        const toggleIcon = dayDiv.querySelector('.fullscreen-toggle');
        toggleIcon.onclick = (e) => toggleFullscreen(dayDiv, dayStr, e);

        // Events - event-popup-v4: Fixed recurring event logic to start on correct dates
        events.forEach(event => {
            const eventDate = new Date(event.date + 'T00:00:00');
            const currentDay = new Date(dayStr + 'T00:00:00');
            let show = false;
            
            if (event.recurrence === 'none') {
                show = event.date === dayStr;
            } else if (event.recurrence === 'daily') {
                show = currentDay >= eventDate;
            } else if (event.recurrence === 'weekly') {
                show = (eventDate.getDay() === currentDay.getDay()) && (currentDay >= eventDate);
            } else if (event.recurrence === 'biweekly') {
                const daysDiff = Math.floor((currentDay - eventDate) / (1000 * 60 * 60 * 24));
                show = (eventDate.getDay() === currentDay.getDay()) && (daysDiff >= 0) && (daysDiff % 14 === 0);
            } else if (event.recurrence === 'monthly') {
                show = (eventDate.getDate() === currentDay.getDate()) && (currentDay >= eventDate);
            } else if (event.recurrence === 'yearly') {
                show = (eventDate.getMonth() === currentDay.getMonth()) && 
                       (eventDate.getDate() === currentDay.getDate()) && 
                       (currentDay >= eventDate);
            }
            
            // event-popup-v4: Check if this specific date is in exceptions
            if (show && event.exceptions && event.exceptions.includes(dayStr)) {
                show = false;
            }
            
            if (show) {
                const eventEl = document.createElement('div');
                eventEl.className = 'event';
                eventEl.style.backgroundColor = event.color || '#e0f7fa';
                
                let eventText = event.title;
                if (event.time) {
                    eventText = event.time + ' - ' + eventText;
                }
                eventEl.textContent = eventText;
                
                // event-popup-v4: Make events clickable for editing
                eventEl.onclick = (e) => {
                    e.stopPropagation(); // Prevent day click
                    editEvent(event.id, dayStr);
                };
                
                dayDiv.appendChild(eventEl);
            }
        });

        // Todos
        todos.forEach(todo => {
            if (todo.dueDate === dayStr && !todo.done) {
                const todoEl = document.createElement('div');
                
                // Check if overdue based on current date/time
                const now = new Date();
                const dueDateTime = new Date(todo.dueDate + 'T' + (todo.dueTime || '23:59:59'));
                const isOverdue = dueDateTime < now;
                
                todoEl.className = `todo-item ${isOverdue ? 'overdue' : ''}`;
                todoEl.textContent = todo.text + (isOverdue ? ' (overdue)' : '');
                
                // calendar-v3: Make todos clickable for editing
                todoEl.onclick = (e) => {
                    e.stopPropagation();
                    editTodo(todo.id);
                };
                todoEl.style.cursor = 'pointer';
                
                dayDiv.appendChild(todoEl);
            }
        });

        dayDiv.onclick = () => addEvent(dayStr);
        calendar.appendChild(dayDiv);
    }
}

function addEvent(date) {
    // calendar-v3: Use unified event modal for adding tasks
    const modal = document.getElementById('event-modal');
    const form = document.getElementById('event-form');
    
    // Reset form
    form.reset();
    
    // Mark as add mode
    form.dataset.editMode = 'false';
    delete form.dataset.eventId;
    delete form.dataset.todoId;
    delete form.dataset.clickedDate;
    
    // Pre-fill the date
    document.getElementById('event-date').value = date;
    
    // Reset color selection
    document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
    document.querySelector('.color-option').classList.add('selected');
    
    // Show add buttons, hide edit/delete buttons
    document.querySelector('.popup-buttons:not(#edit-buttons)').style.display = 'flex';
    document.getElementById('edit-buttons').style.display = 'none';
    document.getElementById('delete-options').style.display = 'none';
    document.querySelector('.event-popup h3').textContent = 'Add Task';
    document.getElementById('selected-date-display').textContent = '';
    
    // Show modal
    modal.classList.add('active');
}

// calendar-v3: Edit existing event - unified with todo editing
function editEvent(eventId, clickedDate) {
    const event = events.find(e => e.id === eventId);
    if (!event) return;
    
    const modal = document.getElementById('event-modal');
    const form = document.getElementById('event-form');
    
    // Store event data
    form.dataset.eventId = eventId;
    form.dataset.eventDate = event.date;
    form.dataset.clickedDate = clickedDate;
    form.dataset.editMode = 'true';
    delete form.dataset.todoId;
    
    // Populate form with event data
    document.getElementById('event-title').value = event.title;
    document.getElementById('event-date').value = event.date;
    document.getElementById('event-recurrence').value = event.recurrence || 'none';
    document.getElementById('event-time').value = event.time || '';
    
    // Select the correct color
    document.querySelectorAll('.color-option').forEach(opt => {
        opt.classList.remove('selected');
        if (opt.dataset.color === event.color) {
            opt.classList.add('selected');
        }
    });
    
    // Show edit buttons, hide add buttons
    document.querySelector('.popup-buttons:not(#edit-buttons)').style.display = 'none';
    document.getElementById('edit-buttons').style.display = 'flex';
    document.getElementById('delete-options').style.display = 'none';
    document.querySelector('.event-popup h3').textContent = 'Edit Event';
    document.getElementById('selected-date-display').textContent = '';
    
    // Show modal
    modal.classList.add('active');
}

// calendar-v4: Clear date field
function clearDate() {
    document.getElementById('event-date').value = '';
}

// event-popup-v2: Close popup function
function closeEventPopup() {
    const modal = document.getElementById('event-modal');
    modal.classList.remove('active');
    document.getElementById('delete-options').style.display = 'none';
}

// calendar-v4: Show delete options for events and todos (or directly delete if non-recurring)
function showDeleteOptions() {
    const form = document.getElementById('event-form');
    const deleteOptions = document.getElementById('delete-options');
    const deleteAllBtn = deleteOptions.querySelector('button:nth-child(2)');
    
    if (form.dataset.eventId) {
        // Deleting an event
        const eventId = parseInt(form.dataset.eventId);
        const event = events.find(e => e.id === eventId);
        
        if (event && event.recurrence !== 'none') {
            // Recurring event - show options
            deleteAllBtn.style.display = 'block';
            deleteOptions.style.display = 'block';
        } else {
            // Non-recurring event - delete directly with confirmation
            if (confirm('Are you sure you want to delete this event?')) {
                deleteEvent('single');
            }
        }
    } else if (form.dataset.todoId) {
        // Deleting a todo - delete directly with confirmation
        if (confirm('Are you sure you want to delete this task?')) {
            deleteEvent('single');
        }
    }
}

// event-popup-v3: Hide delete options
function hideDeleteOptions() {
    document.getElementById('delete-options').style.display = 'none';
}

// calendar-v4: Delete event or todo (single or all recurring)
function deleteEvent(mode) {
    const form = document.getElementById('event-form');
    
    if (form.dataset.eventId) {
        // Deleting an event
        const eventId = parseInt(form.dataset.eventId);
        const clickedDate = form.dataset.clickedDate;
        const event = events.find(e => e.id === eventId);
        if (!event) return;
        
        if (mode === 'single') {
            if (event.recurrence === 'none') {
                // Delete the single event
                events = events.filter(e => e.id !== eventId);
            } else {
                // For recurring events, create an exception
                if (!event.exceptions) {
                    event.exceptions = [];
                }
                event.exceptions.push(clickedDate);
            }
        } else if (mode === 'all') {
            // Delete all instances of the recurring event
            events = events.filter(e => e.id !== eventId);
        }
    } else if (form.dataset.todoId) {
        // Deleting a todo
        const todoId = parseInt(form.dataset.todoId);
        todos = todos.filter(t => t.id !== todoId);
    }
    
    saveData();
    generateCalendar(startDate);
    renderTodos();
    closeEventPopup();
}

// event-popup-v2: Initialize color selection
function initColorSelection() {
    const colorOptions = document.querySelectorAll('.color-option');
    colorOptions.forEach(option => {
        option.addEventListener('click', function() {
            colorOptions.forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
        });
    });
}

// calendar-v3: Handle form submission for both events and todos
function initEventForm() {
    const form = document.getElementById('event-form');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const title = document.getElementById('event-title').value.trim();
        if (!title) {
            alert('Title is required');
            return;
        }
        
        const date = document.getElementById('event-date').value;
        if (!date) {
            alert('Date is required');
            return;
        }
        
        const recurrence = document.getElementById('event-recurrence').value;
        const time = document.getElementById('event-time').value;
        const selectedColor = document.querySelector('.color-option.selected');
        const color = selectedColor ? selectedColor.dataset.color : '#e0f7fa';
        
        const isEditMode = form.dataset.editMode === 'true';
        
        if (isEditMode) {
            // Edit mode - could be event or todo
            if (form.dataset.eventId) {
                // Editing an event
                const eventId = parseInt(form.dataset.eventId);
                const event = events.find(e => e.id === eventId);
                if (event) {
                    event.title = title;
                    event.date = date;
                    event.recurrence = recurrence;
                    event.time = time || null;
                    event.color = color;
                }
            } else if (form.dataset.todoId) {
                // Editing a todo
                const todoId = parseInt(form.dataset.todoId);
                const todo = todos.find(t => t.id === todoId);
                if (todo) {
                    todo.text = title;
                    todo.dueDate = date;
                    todo.dueTime = time || null;
                }
            }
        } else {
            // Add mode - create new todo
            todos.push({ 
                id: Date.now(), 
                text: title, 
                done: false, 
                dueDate: date,
                dueTime: time || null
            });
        }
        
        saveData();
        generateCalendar(startDate);
        renderTodos();
        closeEventPopup();
    });
}

function addTodo() {
    const input = document.getElementById('new-todo');
    const text = input.value.trim();
    if (!text) return;
    todos.push({ id: Date.now(), text, done: false, dueDate: null, dueTime: null });
    input.value = '';
    saveData();
    renderTodos();
}

function renderTodos() {
    const list = document.getElementById('todo-list');
    const completedList = document.getElementById('completed-list');
    const completedSection = document.getElementById('completed-section');
    
    list.innerHTML = '';
    completedList.innerHTML = '';
    
    const activeTodos = todos.filter(t => !t.done);
    const completedTodos = todos.filter(t => t.done);
    
    // Render active todos
    activeTodos.forEach(todo => {
        const li = document.createElement('li');
        li.className = 'todo-item-enhanced';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = todo.done;
        checkbox.onchange = () => toggleTodo(todo.id, checkbox.checked);
        
        const textSpan = document.createElement('span');
        textSpan.className = 'todo-text';
        textSpan.textContent = todo.text;
        
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'todo-buttons';
        
        if (todo.dueDate) {
            const dateInfo = document.createElement('span');
            dateInfo.className = 'todo-date-info';
            const dueDate = new Date(todo.dueDate + 'T' + (todo.dueTime || '00:00:00'));
            const now = new Date();
            const isOverdue = dueDate < now;
            
            if (isOverdue) {
                dateInfo.className = 'todo-date-info overdue';
                dateInfo.textContent = '(overdue)';
            } else {
                dateInfo.textContent = formatDate(todo.dueDate) + (todo.dueTime ? ' at ' + formatTime(todo.dueTime) : '');
            }
            buttonContainer.appendChild(dateInfo);
        }
        
        const editBtn = document.createElement('button');
        editBtn.className = 'btn-todo-action btn-todo-edit';
        editBtn.textContent = 'Edit';
        editBtn.onclick = () => editTodo(todo.id);
        buttonContainer.appendChild(editBtn);
        
        li.appendChild(checkbox);
        li.appendChild(textSpan);
        li.appendChild(buttonContainer);
        list.appendChild(li);
    });
    
    // Render completed todos
    completedTodos.forEach(todo => {
        const li = document.createElement('li');
        li.className = 'todo-item-enhanced completed';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = true;
        checkbox.onchange = () => toggleTodo(todo.id, checkbox.checked);
        
        const textSpan = document.createElement('span');
        textSpan.className = 'todo-text';
        textSpan.textContent = todo.text;
        
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'todo-buttons';
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-todo-action btn-todo-delete';
        deleteBtn.textContent = 'Delete';
        deleteBtn.onclick = () => {
            if (confirm('Delete this completed task?')) {
                todos = todos.filter(t => t.id !== todo.id);
                saveData();
                renderTodos();
            }
        };
        buttonContainer.appendChild(deleteBtn);
        
        li.appendChild(checkbox);
        li.appendChild(textSpan);
        li.appendChild(buttonContainer);
        completedList.appendChild(li);
    });
    
    // Show/hide completed section
    completedSection.style.display = completedTodos.length > 0 ? 'block' : 'none';
}

function formatDate(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);
    
    if (dateOnly.getTime() === today.getTime()) {
        return 'Today';
    } else if (dateOnly.getTime() === tomorrow.getTime()) {
        return 'Tomorrow';
    } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
}

function formatTime(timeStr) {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
}

// calendar-v3: Edit todo using unified event modal
function editTodo(id) {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;
    
    const modal = document.getElementById('event-modal');
    const form = document.getElementById('event-form');
    
    // Store todo data
    form.dataset.todoId = id;
    form.dataset.editMode = 'true';
    delete form.dataset.eventId;
    delete form.dataset.clickedDate;
    
    // Populate form with todo data
    document.getElementById('event-title').value = todo.text;
    document.getElementById('event-date').value = todo.dueDate || '';
    document.getElementById('event-recurrence').value = 'none';
    document.getElementById('event-time').value = todo.dueTime || '';
    
    // Select default color for todos
    document.querySelectorAll('.color-option').forEach(opt => {
        opt.classList.remove('selected');
        if (opt.dataset.color === '#e0f7fa') {
            opt.classList.add('selected');
        }
    });
    
    // Show edit buttons, hide add buttons
    document.querySelector('.popup-buttons:not(#edit-buttons)').style.display = 'none';
    document.getElementById('edit-buttons').style.display = 'flex';
    document.getElementById('delete-options').style.display = 'none';
    document.querySelector('.event-popup h3').textContent = 'Edit Task';
    document.getElementById('selected-date-display').textContent = '';
    
    // Show modal
    modal.classList.add('active');
}

function closeTodoPopup() {
    const modal = document.getElementById('todo-modal');
    modal.classList.remove('active');
}

function deleteTodo() {
    const form = document.getElementById('todo-form');
    const todoId = parseInt(form.dataset.todoId);
    
    if (confirm('Delete this task?')) {
        todos = todos.filter(t => t.id !== todoId);
        saveData();
        generateCalendar(startDate);
        renderTodos();
        closeTodoPopup();
    }
}

function initTodoForm() {
    const form = document.getElementById('todo-form');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const text = document.getElementById('todo-text').value.trim();
        if (!text) {
            alert('Task text is required');
            return;
        }
        
        const dueDate = document.getElementById('todo-date').value || null;
        const dueTime = document.getElementById('todo-time').value || null;
        
        if (form.dataset.todoId) {
            // Edit mode
            const todoId = parseInt(form.dataset.todoId);
            const todo = todos.find(t => t.id === todoId);
            
            if (todo) {
                todo.text = text;
                todo.dueDate = dueDate;
                todo.dueTime = dueTime;
            }
        } else {
            // Add mode
            todos.push({ 
                id: Date.now(), 
                text, 
                done: false, 
                dueDate, 
                dueTime 
            });
        }
        
        saveData();
        generateCalendar(startDate);
        renderTodos();
        closeTodoPopup();
    });
}

// calendar-v4: Toggle completed tasks section
function toggleCompletedSection() {
    const completedList = document.getElementById('completed-list');
    const toggle = document.getElementById('completed-toggle');
    
    if (completedList.style.display === 'none') {
        completedList.style.display = 'block';
        toggle.textContent = '▼';
    } else {
        completedList.style.display = 'none';
        toggle.textContent = '▶';
    }
}

function toggleTodo(id, done) {
    const todo = todos.find(t => t.id === id);
    if (todo) todo.done = done;
    saveData();
    generateCalendar(startDate);
    renderTodos();
}

function prevWeeks() {
    startDate.setDate(startDate.getDate() - 42);
    generateCalendar(startDate);
}

function nextWeeks() {
    startDate.setDate(startDate.getDate() + 42);
    generateCalendar(startDate);
}

// calendar-v2: Jump to current week
function goToToday() {
    const today = new Date();
    // Set to the Sunday of the current week
    startDate = new Date(today);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    generateCalendar(startDate);
}

// Init
processOverdueTodos();
// Set startDate to current Sunday
startDate = new Date();
startDate.setDate(startDate.getDate() - startDate.getDay());

// event-popup-v5: Initialize event form and color selection before generating calendar
// This ensures the modal elements exist when we try to attach event listeners
document.addEventListener('DOMContentLoaded', function() {
    applyDarkMode(); // calendar-v5: Apply dark mode on load
    initEventForm();
    initColorSelection();
    generateCalendar(startDate);
    renderTodos();
    
    // event-popup-v5: Close modal when clicking outside
    const modal = document.getElementById('event-modal');
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeEventPopup();
        }
    });
    
    // event-popup-v5: Close fullscreen when clicking backdrop
    const backdrop = document.getElementById('fullscreen-backdrop');
    backdrop.addEventListener('click', function() {
        if (currentFullscreenDay) {
            const toggleIcon = currentFullscreenDay.querySelector('.fullscreen-toggle');
            toggleIcon.click();
        }
    });
});