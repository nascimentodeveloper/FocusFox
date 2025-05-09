const fs = require('fs');
const path = require('path');
const os = require('os');

const dataFile = path.join(os.homedir(), 'tasks.json');

const taskForm = document.getElementById('task-form');
const taskList = document.getElementById('task-list');
const stopButton = document.getElementById('stopButton');
const startButton = document.getElementById('startButton');
const pauseButton = document.getElementById('pauseButton');
const resumeButton = document.getElementById('resumeButton');

let isPomodoroActive = false;
let isPomodoroPaused = false;
let pomodoroTime = 25 * 60;
let timeLeft = pomodoroTime;
let interval;

let timerInterval;
let remainingTime = 0;
let isPomodoro = true;
let pomodorosCompleted = 0;
let currentTaskIndex = null;
let tasks = [];

let pomodoroDuration = 25 * 60;
const progressBar = document.getElementById('progress-bar');
const timeDisplay = document.getElementById('time-display');

window.onload = function () {
    loadTasks();

    const savedState = JSON.parse(localStorage.getItem('pomodoroState'));
    if (savedState) {
        remainingTime = savedState.remainingTime;
        isPomodoro = savedState.isPomodoro;
        pomodorosCompleted = savedState.pomodorosCompleted;
        updateTimerDisplay(document.getElementById('timer'));
    } else {
        resetTimer();
    }

    if (fs.existsSync(dataFile)) {
        tasks = JSON.parse(fs.readFileSync(dataFile));
        tasks.forEach(addTaskToList);
    }
};

taskForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const task = {
        name: document.getElementById('name').value,
        category: document.getElementById('category').value,
        description: document.getElementById('description').value,
        pomodoros: parseInt(document.getElementById('pomodoros').value),
        completedPomodoros: 0 // Novo campo
    };

    saveTask(task);
    taskForm.reset();
    loadTasks();
});

function saveTask(task) {
    let tasks = [];
    if (fs.existsSync(dataFile)) {
        tasks = JSON.parse(fs.readFileSync(dataFile));
    }
    tasks.push(task);
    fs.writeFileSync(dataFile, JSON.stringify(tasks, null, 2));
}

function addTaskToList(task, index) {
    const li = document.createElement('li');
    li.innerHTML = `
        <strong>${task.name}</strong> (${task.pomodoros} pomodoros) - ${task.category}<br/>
        <p>${task.category}</p> <!-- Exibe a categoria para filtro -->
        <small>${task.description}</small><br/>
        <button onclick="startPomodoro(${index})">Iniciar Pomodoro</button>
        <button onclick="editTask(${index})">Editar</button>
        <button onclick="deleteTask(${index})">Excluir</button>
    `;
    taskList.appendChild(li);
}

function startPomodoro() {
    if (isPomodoroActive) return;

    isPomodoroActive = true;
    isPomodoroPaused = false;
    document.getElementById("startButton").disabled = true;
    document.getElementById("pauseButton").disabled = false;
    document.getElementById("stopButton").disabled = false;
    document.getElementById("resumeButton").disabled = true;
    timeLeft = pomodoroTime;

    updateTimer();

    interval = setInterval(() => {
        if (timeLeft > 0) {
            timeLeft--;
            updateTimer();
        } else {
            clearInterval(interval);
            alert("Pomodoro finalizado!");
            pomodorosCompleted++;
            saveStateToLocalStorage();
        }
    }, 1000);
}

function pausePomodoro() {
    clearInterval(interval);
    isPomodoroPaused = true;
    document.getElementById("pauseButton").disabled = true;
    document.getElementById("resumeButton").disabled = false;
}

function resumePomodoro() {
    if (isPomodoroPaused) {
        interval = setInterval(() => {
            if (timeLeft > 0) {
                timeLeft--;
                updateTimer();
            } else {
                clearInterval(interval);
                alert("Pomodoro finalizado!");
                pomodorosCompleted++;
                saveStateToLocalStorage();
            }
        }, 1000);
        isPomodoroPaused = false;
        document.getElementById("resumeButton").disabled = true;
        document.getElementById("pauseButton").disabled = false;
    }
}

function stopPomodoro() {
    clearInterval(interval);
    isPomodoroActive = false;
    timeLeft = pomodoroTime;
    updateTimer();
    document.getElementById("startButton").disabled = false;
    document.getElementById("pauseButton").disabled = true;
    document.getElementById("stopButton").disabled = true;
    document.getElementById("resumeButton").disabled = true;
}

function updateProgressBar() {
    const progress = ((pomodoroTime - timeLeft) / pomodoroTime) * 100;
    progressBar.value = progress;
}

function updateTimer() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    document.getElementById("time-display").textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    updateProgressBar();
}

function updateTimeDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timeDisplay.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

function loadTasks() {
    taskList.innerHTML = '';
    if (fs.existsSync(dataFile)) {
        tasks = JSON.parse(fs.readFileSync(dataFile));
        tasks.forEach((task, index) => addTaskToList(task, index));
    }
}

function editTask(index) {
    const tasks = JSON.parse(fs.readFileSync(dataFile));
    const task = tasks[index];

    document.getElementById('name').value = task.name;
    document.getElementById('category').value = task.category;
    document.getElementById('description').value = task.description;
    document.getElementById('pomodoros').value = task.pomodoros;

    tasks.splice(index, 1);
    fs.writeFileSync(dataFile, JSON.stringify(tasks, null, 2));
    loadTasks();
}

function deleteTask(index) {
    const tasks = JSON.parse(fs.readFileSync(dataFile));
    tasks.splice(index, 1);
    fs.writeFileSync(dataFile, JSON.stringify(tasks, null, 2));
    loadTasks();
}

const toggleButton = document.getElementById('toggle-theme');
const prefersDark = localStorage.getItem('theme') === 'dark';

if (prefersDark) {
    document.body.classList.add('dark-mode');
    toggleButton.textContent = '☀️ Modo Claro';
}

toggleButton.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    toggleButton.textContent = isDark ? '☀️ Modo Claro' : '🌙 Modo Escuro';
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
});

function saveStateToLocalStorage() {
    const state = {
        remainingTime,
        isPomodoro,
        pomodorosCompleted
    };
    localStorage.setItem('pomodoroState', JSON.stringify(state));
}
