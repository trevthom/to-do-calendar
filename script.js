let events = JSON.parse(localStorage.getItem('events')) || [];
let todos = JSON.parse(localStorage.getItem('todos')) || [];
let startDate = new Date(); // Will be set to Sunday of current week

function saveData() {
    localStorage.setItem('events', JSON.stringify(events));
    localStorage.setItem('todos', JSON.stringify(todos));
}

function getDateString(date) {
    return date.toISOString().split('T')[0];
}

function processOverdueTodos() {
    const todayStr = getDateString(new Date());
    todos.forEach(todo => {
        if (todo.dueDate && todo.dueDate < todayStr && !todo.done) {
            todo.dueDate = todayStr;
            todo.overdue = true;
        }
    });
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
        dayDiv.innerHTML = `<div class="date">${day.getDate()}</div>`;

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
                todoEl.className = `todo-item ${todo.overdue ? 'overdue' : ''}`;
                todoEl.textContent = todo.text + (todo.overdue ? ' (overdue)' : '');
                dayDiv.appendChild(todoEl);
            }
        });

        dayDiv.onclick = () => addEvent(dayStr);
        calendar.appendChild(dayDiv);
    }
}

function addEvent(date) {
    // event-popup-v4: Open custom popup for adding new event
    const modal = document.getElementById('event-modal');
    const form = document.getElementById('event-form');
    
    // Store the date for this event
    form.dataset.eventDate = date;
    form.dataset.editMode = 'false';
    delete form.dataset.eventId;
    delete form.dataset.clickedDate;
    
    // Reset form
    form.reset();
    document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
    document.querySelector('.color-option').classList.add('selected');
    
    // event-popup-v4: Show add buttons, hide edit/delete buttons
    document.querySelector('.popup-buttons:not(#edit-buttons)').style.display = 'flex';
    document.getElementById('edit-buttons').style.display = 'none';
    document.getElementById('delete-options').style.display = 'none';
    document.querySelector('.event-popup h3').textContent = 'Add Event';
    
    // event-popup-v4: Display the selected date
    const dateObj = new Date(date + 'T00:00:00');
    document.getElementById('selected-date-display').textContent = dateObj.toDateString();
    
    // Show modal
    modal.classList.add('active');
}

// event-popup-v4: Edit existing event
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
    
    // Populate form with event data
    document.getElementById('event-title').value = event.title;
    document.getElementById('event-recurrence').value = event.recurrence || 'none';
    document.getElementById('event-time').value = event.time || '';
    
    // Select the correct color
    document.querySelectorAll('.color-option').forEach(opt => {
        opt.classList.remove('selected');
        if (opt.dataset.color === event.color) {
            opt.classList.add('selected');
        }
    });
    
    // event-popup-v4: Show edit buttons, hide add buttons
    document.querySelector('.popup-buttons:not(#edit-buttons)').style.display = 'none';
    document.getElementById('edit-buttons').style.display = 'flex';
    document.getElementById('delete-options').style.display = 'none';
    document.querySelector('.event-popup h3').textContent = 'Edit Event';
    
    // event-popup-v4: Display the original event date
    const dateObj = new Date(event.date + 'T00:00:00');
    document.getElementById('selected-date-display').textContent = 'Original date: ' + dateObj.toDateString();
    
    // Show modal
    modal.classList.add('active');
}

// event-popup-v2: Close popup function
function closeEventPopup() {
    const modal = document.getElementById('event-modal');
    modal.classList.remove('active');
    document.getElementById('delete-options').style.display = 'none';
}

// event-popup-v3: Show delete options
function showDeleteOptions() {
    const form = document.getElementById('event-form');
    const eventId = parseInt(form.dataset.eventId);
    const event = events.find(e => e.id === eventId);
    
    const deleteOptions = document.getElementById('delete-options');
    const deleteAllBtn = deleteOptions.querySelector('button:nth-child(2)');
    
    // Show or hide "Delete All" button based on recurrence
    if (event && event.recurrence !== 'none') {
        deleteAllBtn.style.display = 'block';
    } else {
        deleteAllBtn.style.display = 'none';
    }
    
    deleteOptions.style.display = 'block';
}

// event-popup-v3: Hide delete options
function hideDeleteOptions() {
    document.getElementById('delete-options').style.display = 'none';
}

// event-popup-v3: Delete event (single or all recurring)
function deleteEvent(mode) {
    const form = document.getElementById('event-form');
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
    
    saveData();
    generateCalendar(startDate);
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

// event-popup-v3: Handle form submission (add or update)
function initEventForm() {
    const form = document.getElementById('event-form');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const title = document.getElementById('event-title').value.trim();
        if (!title) {
            alert('Event title is required');
            return;
        }
        
        const recurrence = document.getElementById('event-recurrence').value;
        const time = document.getElementById('event-time').value;
        const selectedColor = document.querySelector('.color-option.selected');
        const color = selectedColor ? selectedColor.dataset.color : '#e0f7fa';
        
        const isEditMode = form.dataset.editMode === 'true';
        
        if (isEditMode) {
            // Update existing event
            const eventId = parseInt(form.dataset.eventId);
            const event = events.find(e => e.id === eventId);
            if (event) {
                event.title = title;
                event.recurrence = recurrence;
                event.time = time || null;
                event.color = color;
                // Note: We don't change the original date for recurring events
            }
        } else {
            // Add new event
            const date = form.dataset.eventDate;
            events.push({ 
                id: Date.now(), 
                title, 
                date, 
                recurrence,
                time: time || null,
                color: color
            });
        }
        
        saveData();
        generateCalendar(startDate);
        closeEventPopup();
    });
}

function addTodo() {
    const input = document.getElementById('new-todo');
    const text = input.value.trim();
    if (!text) return;
    todos.push({ id: Date.now(), text, done: false, dueDate: null, overdue: false });
    input.value = '';
    saveData();
    renderTodos();
}

function renderTodos() {
    const list = document.getElementById('todo-list');
    list.innerHTML = '';
    todos.forEach(todo => {
        const li = document.createElement('li');
        li.innerHTML = `
            <input type="checkbox" ${todo.done ? 'checked' : ''} onchange="toggleTodo(${todo.id}, this.checked)">
            ${todo.text} ${todo.overdue ? '(overdue)' : ''}
            <button onclick="assignDate(${todo.id})">Assign Date</button>
        `;
        list.appendChild(li);
    });
}

function toggleTodo(id, done) {
    const todo = todos.find(t => t.id === id);
    if (todo) todo.done = done;
    saveData();
    generateCalendar(startDate);
    renderTodos();
}

function assignDate(id) {
    const date = prompt('Due date (YYYY-MM-DD):');
    if (!date) return;
    const todo = todos.find(t => t.id === id);
    if (todo) todo.dueDate = date;
    saveData();
    processOverdueTodos();
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

// Init
processOverdueTodos();
// Set startDate to current Sunday
startDate = new Date();
startDate.setDate(startDate.getDate() - startDate.getDay());

// event-popup-v2: Initialize event form and color selection before generating calendar
// This ensures the modal elements exist when we try to attach event listeners
document.addEventListener('DOMContentLoaded', function() {
    initEventForm();
    initColorSelection();
    generateCalendar(startDate);
    renderTodos();
    
    // event-popup-v2: Close modal when clicking outside
    const modal = document.getElementById('event-modal');
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeEventPopup();
        }
    });
});