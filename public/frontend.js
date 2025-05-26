// Global variables
const BACKEND_URL = 'https://quiz-app-j251.onrender.com';
let currentUser = null;
let currentQuiz = null;
let currentQuestionIndex = 0;
let userAnswers = {};
let timer = null;

// Setup password toggle functionality
document.querySelectorAll('.toggle-password').forEach(button => {
    button.addEventListener('click', function() {
        const input = this.previousElementSibling;
        const icon = this.querySelector('i');
        
        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('bi-eye');
            icon.classList.add('bi-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.remove('bi-eye-slash');
            icon.classList.add('bi-eye');
        }
    });
});

// Check if user is already logged in
const token = localStorage.getItem('token');
if (token) {
    fetch(`${BACKEND_URL}/api/auth/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(user => {
        if (!user.error) {
            handleLoginSuccess(user);
        }
    });
}

// Authentication Functions
async function handleForgotPassword(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const email = formData.get('forgotEmail'); // Get email from the updated form field
    const newPassword = formData.get('newPassword');
    const confirmPassword = formData.get('confirmPassword');

    if (newPassword !== confirmPassword) {
        alert('Passwords do not match!');
        return false;
    }

    try {
        const response = await fetch(`${BACKEND_URL}/api/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: email, // Send email as username to match backend route
                newPassword: newPassword,
                confirmPassword: confirmPassword
            })
        });

        const data = await response.json();
        if (response.ok) {
            alert('Password updated successfully! Please login.');
            document.querySelector('[href="#login"]').click();
        } else {
            alert(data.message);
        }
    } catch (error) {
        alert('Error resetting password');
    }
    return false;
}

async function handleLogin(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    try {
        const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: formData.get('username'),
                password: formData.get('password')
            })
        });

        const data = await response.json();
        if (response.ok) {
            localStorage.setItem('token', data.token);
            handleLoginSuccess(data.user);
        } else {
            alert(data.message);
        }
    } catch (error) {
        alert('Error logging in');
    }
    return false;
}

async function handleRegister(event) {
    event.preventDefault(); // Ensure default form submission is prevented
    const formData = new FormData(event.target);
    
    try {
        const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: formData.get('email'), // Only send email
                password: formData.get('password')
            })
        });

        const data = await response.json();
        if (response.ok) {
            alert('Registration successful! Please login.');
            document.querySelector('[href="#login"]').click();
        } else {
            alert(data.message);
        }
    } catch (error) {
        alert('Error registering');
    }
    return false; // Prevent default form submission
}

function handleLoginSuccess(user) {
    currentUser = user;
    document.getElementById('authForms').style.display = 'none';
    document.getElementById('userSection').style.display = 'flex';
    document.getElementById('username').textContent = user.username;
    
    if (user.role === 'admin') {
        document.getElementById('adminSection').style.display = 'block';
        loadAdminDashboard();
    } else {
        document.getElementById('quizSection').style.display = 'block';
    }
}

function logout() {
    localStorage.removeItem('token');
    currentUser = null;
    location.reload();
    removeCheatDetection(); // Remove listeners on logout
}

// Admin Functions
async function loadAdminDashboard() {
    // Existing logic to load all results
    try {
        const response = await fetch(`${BACKEND_URL}/api/admin/results`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const users = await response.json();
        displayUserResults(users);
    } catch (error) {
        console.error('Error loading admin dashboard:', error);
        document.getElementById('resultsTable').innerHTML = '<p>Error loading results.</p>';
    }
}

async function searchUserResults() {
    const username = document.getElementById('userSearchInput').value;
    if (!username) {
        alert('Please enter a username to search.');
        return;
    }

    try {
        const response = await fetch(`/api/admin/results/search?username=${encodeURIComponent(username)}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const users = await response.json();
        if (response.ok) {
            console.log('Search results:', users);
            displayUserResults(users);
        } else {
            // Handle cases where user is not found or other errors
            document.getElementById('resultsTable').innerHTML = `<p>${users.message || 'User not found.'}</p>`;
        }
    } catch (error) {
        console.error('Error searching user results:', error);
        document.getElementById('resultsTable').innerHTML = '<p>Error searching results.</p>';
    }
}

// Add event listener for the search button
document.addEventListener('DOMContentLoaded', () => {
    const searchButton = document.getElementById('searchUserResultsBtn');
    if (searchButton) {
        searchButton.addEventListener('click', async () => {
            const username = document.getElementById('userSearchInput').value.trim();
            const exportPdfBtn = document.getElementById('exportPdfBtn');
            
            if (!username) {
                exportPdfBtn.style.display = 'none';
                await loadUserResults(); // Load all results if no username specified
                return;
            }

            // Show export button for specific user search
            exportPdfBtn.style.display = 'block';
            exportPdfBtn.onclick = () => exportUserResultsPDF(username);
            await searchUserResults();
        });
    }
});

// Quiz Functions
async function startQuiz(language) {
    try {
        const response = await fetch(`/api/quiz/questions/${language}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const questions = await response.json();
        
        if (questions.length === 0) {
            alert('No questions available for this language');
            return;
        }

        currentQuiz = {
            questions,
            language,
            startTime: new Date()
        };
        currentQuestionIndex = 0;
        userAnswers = {};

        document.getElementById('languageSelection').style.display = 'none';
        document.getElementById('quizContent').style.display = 'block';
        startTimer();
        showQuestion();
        setupCheatDetection();
    } catch (error) {
        alert('Error starting quiz');
    }
}

let tabSwitchCount = 0;
const maxTabSwitches = 3; // Define a maximum allowed tab switches

function setupCheatDetection() {
    // Detect if the window loses focus (user switches tabs or clicks outside)
    window.addEventListener('blur', handleWindowBlur);
    // Detect if the window gains focus back
    window.addEventListener('focus', handleWindowFocus);
}

function handleWindowBlur() {
    if (currentQuiz && timer) { // Only track during an active quiz
        tabSwitchCount++;
        console.warn(`Tab switch detected. Count: ${tabSwitchCount}`);
        // Optionally pause the timer or show a warning immediately
        // clearInterval(timer); // Example: pause timer

        if (tabSwitchCount >= maxTabSwitches) {
            // Trigger auto-submit or a final warning
            alert(`You have switched tabs ${maxTabSwitches} times. The quiz will now be submitted.`);
            submitQuiz();
        } else {
            const ordinalSuffix = (count) => {
                const j = count % 10, k = count % 100;
                if (j === 1 && k !== 11) return count + "st";
                if (j === 2 && k !== 12) return count + "nd";
                if (j === 3 && k !== 13) return count + "rd";
                return count + "th";
            };
            alert(`Warning: Switching tabs is not allowed during the quiz. You have switched tabs ${ordinalSuffix(tabSwitchCount)} time${tabSwitchCount > 1 ? 's' : ''}. You have ${maxTabSwitches - tabSwitchCount} attempt${maxTabSwitches - tabSwitchCount !== 1 ? 's' : ''} left before auto-submission.`);
        }
    }
}

function handleWindowFocus() {
    if (currentQuiz && timer) { // Only resume if a quiz is active
        console.log('Window focused.');
        // Optionally resume the timer if it was paused
        // startTimer(); // Example: resume timer (need to handle remaining time)
    }
}

// Remember to remove event listeners when the quiz finishes or user logs out
function removeCheatDetection() {
    window.removeEventListener('blur', handleWindowBlur);
    window.removeEventListener('focus', handleWindowFocus);
}

function showQuestion() {
    const question = currentQuiz.questions[currentQuestionIndex];
    const totalQuestions = currentQuiz.questions.length;
    
    // Update question number and progress bar
    document.getElementById('questionNumber').textContent = `Question ${currentQuestionIndex + 1}/${totalQuestions}`;
    const remainingQuestions = totalQuestions - (currentQuestionIndex + 1);
    document.getElementById('remainingQuestions').textContent = `${remainingQuestions} question${remainingQuestions !== 1 ? 's' : ''} remaining`;
    const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;
    const progressBar = document.getElementById('progressBar');
    progressBar.style.width = `${progress}%`;
    progressBar.setAttribute('aria-valuenow', progress);
    
    // Show question and options
    document.getElementById('question').textContent = question.question;
    const optionsContainer = document.getElementById('options');
    optionsContainer.innerHTML = '';
    
    question.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.className = 'btn btn-outline-primary';
        button.textContent = option;
        button.onclick = () => selectOption(index);
        optionsContainer.appendChild(button);
    });

    document.getElementById('nextButton').style.display = 'none';
    
    // Update next button text for last question
    const nextButton = document.getElementById('nextButton');
    if (currentQuestionIndex === totalQuestions - 1) {
        nextButton.textContent = 'Finish Quiz';
    } else {
        nextButton.textContent = 'Next Question';
    }
}

function selectOption(optionIndex) {
    const questionId = currentQuiz.questions[currentQuestionIndex]._id;
    userAnswers[questionId] = optionIndex;

    const options = document.getElementById('options').children;
    for (let button of options) {
        button.classList.remove('selected');
    }
    options[optionIndex].classList.add('selected');

    document.getElementById('nextButton').style.display = 'block';
    document.getElementById('nextButton').onclick = () => {
        if (currentQuestionIndex < currentQuiz.questions.length - 1) {
            currentQuestionIndex++;
            showQuestion();
        } else {
            submitQuiz();
        }
    };
}

async function submitQuiz() {
    try {
        const response = await fetch('/api/quiz/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                answers: userAnswers,
                language: currentQuiz.language
            })
        });

        const result = await response.json();
        showResults(result);
        removeCheatDetection(); // Remove listeners after quiz submission
    } catch (error) {
        alert('Error submitting quiz');
    }
}

function showResults(result) {
    clearInterval(timer);
    document.getElementById('quizContent').style.display = 'none';
    document.getElementById('resultSection').style.display = 'block';
    document.getElementById('score').textContent = result.score;
    document.getElementById('percentage').textContent = result.percentage.toFixed(1);

    // Add certificate download link if available
    if (result.certificate && result.certificate.filePath && result.certificate.fileName) {
        const certificateLink = document.createElement('a');
        certificateLink.href = result.certificate.filePath;
        certificateLink.download = result.certificate.fileName;
        certificateLink.textContent = 'Download Certificate';
        certificateLink.className = 'btn btn-success mt-3'; // Add some styling
        document.getElementById('resultSection').appendChild(certificateLink);
    }
}

function showLanguageSelection() {
    document.getElementById('resultSection').style.display = 'none';
    document.getElementById('languageSelection').style.display = 'block';
}

function startTimer() {
    let timeLeft = currentQuiz.questions[0].timeLimit; // Get time limit from first question
    const timerDisplay = document.getElementById('timer');
    
    timer = setInterval(() => {
        if (timeLeft <= 0) {
            clearInterval(timer);
            removeCheatDetection(); // Remove listeners when time runs out
            submitQuiz(); // Auto-submit when time runs out
            return;
        }
        
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerDisplay.textContent = `Time Remaining: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        timerDisplay.className = timeLeft <= 30 ? 'badge bg-danger' : 'badge bg-primary'; // Red when ≤ 30 seconds
        
        timeLeft--;
    }, 1000);
}

// Admin Functions
async function loadAdminDashboard() {
    await Promise.all([
        loadStatistics(),
        loadUserResults(),
        loadQuestions()
    ]);
    setupAddQuestionForm();
}

// Handle PDF Export
async function exportUserResultsPDF(username) {
    try {
        const response = await fetch(`/api/admin/results/export/${username}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message);
        }

        // Create a blob from the PDF stream
        const blob = await response.blob();
        // Create a link to download the PDF
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `quiz_results_${username}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (error) {
        console.error('Error exporting PDF:', error);
        alert('Error exporting PDF: ' + error.message);
    }
}

// Load Statistics
async function loadStatistics() {
    try {
        const response = await fetch('/api/admin/statistics', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const statistics = await response.json();

        // Update statistics display
        document.getElementById('averageScore').textContent = statistics.averageScore;
        document.getElementById('totalQuizzes').textContent = statistics.totalQuizzesTaken;

        // Display top performers
        const topPerformersList = document.getElementById('topPerformersList');
        topPerformersList.innerHTML = statistics.topPerformers.map((performer, index) => `
            <div class="list-group-item d-flex justify-content-between align-items-center">
                <div>
                    <span class="badge bg-primary me-2">#${index + 1}</span>
                    ${performer.username}
                </div>
                <span class="badge bg-success">${performer.bestScore}%</span>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading statistics:', error);
        alert('Error loading statistics');
    }
}

// Setup Add Question Form
function setupAddQuestionForm() {
    const form = document.getElementById('addQuestionForm');
    form.innerHTML = `
        <h4>Add New Question</h4>
        <div class="mb-3">
            <select class="form-control" name="language" required>
                <option value="">Select Language</option>
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
            </select>
        </div>
        <div class="mb-3">
            <textarea class="form-control" name="question" placeholder="Enter Question" required></textarea>
        </div>
        <div class="mb-3" id="optionsContainer">
            <label>Options:</label>
            <div class="option-inputs">
                <input type="text" class="form-control mb-2" name="option1" placeholder="Option 1" required>
                <input type="text" class="form-control mb-2" name="option2" placeholder="Option 2" required>
                <input type="text" class="form-control mb-2" name="option3" placeholder="Option 3" required>
                <input type="text" class="form-control mb-2" name="option4" placeholder="Option 4" required>
            </div>
        </div>
        <div class="mb-3">
            <select class="form-control" name="correctAnswer" required>
                <option value="">Select Correct Answer</option>
                <option value="0">Option 1</option>
                <option value="1">Option 2</option>
                <option value="2">Option 3</option>
                <option value="3">Option 4</option>
            </select>
        </div>
        <div class="mb-3">
            <select class="form-control" name="difficulty" required>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
            </select>
        </div>
        <div class="mb-3">
            <textarea class="form-control" name="explanation" placeholder="Explanation for the correct answer" required></textarea>
        </div>
        <button type="submit" class="btn btn-primary">Add Question</button>
    `;

    form.onsubmit = handleAddQuestion;
}

// Handle Add Question Form Submission
async function handleAddQuestion(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    const questionData = {
        language: formData.get('language'),
        question: formData.get('question'),
        options: [
            formData.get('option1'),
            formData.get('option2'),
            formData.get('option3'),
            formData.get('option4')
        ],
        correctAnswer: parseInt(formData.get('correctAnswer')),
        difficulty: formData.get('difficulty'),
        explanation: formData.get('explanation')
    };

    try {
        const response = await fetch('/api/admin/questions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(questionData)
        });

        const result = await response.json();
        if (response.ok) {
            alert('Question added successfully!');
            event.target.reset();
            loadQuestions(); // Reload questions list
        } else {
            alert(result.message || 'Error adding question');
        }
    } catch (error) {
        alert('Error adding question');
    }
}

async function loadUserResults() {
    try {
        const response = await fetch('/api/admin/results', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const users = await response.json();

        const table = document.createElement('table');
        table.className = 'table table-striped';
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Username</th>
                    <th>Language</th>
                    <th>Score</th>
                    <th>Date</th>
                </tr>
            </thead>
            <tbody>
                ${users.map(user => 
                    user.quizResults.map(result => `
                        <tr>
                            <td>${user.username}</td>
                            <td>${result.language}</td>
                            <td>${result.score}/${result.totalQuestions}</td>
                            <td>${new Date(result.date).toLocaleDateString()}</td>
                        </tr>
                    `).join('')
                ).join('')}
            </tbody>
        `;

        document.getElementById('resultsTable').innerHTML = '';
        displayUserResults(users);
    } catch (error) {
        alert('Error loading user results');
    }
}

function displayUserResults(users) {
    const table = document.createElement('table');
    table.className = 'table table-striped';
    table.innerHTML = `
        <thead>
            <tr>
                <th>Username</th>
                <th>Language</th>
                <th>Score</th>
                <th>Date</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody>
            ${users.map(user =>
                user.quizResults.map((result, index) => `
                    <tr>
                        <td>${user.username}</td>
                        <td>${result.language}</td>
                        <td>${result.score}/${result.totalQuestions}</td>
                        <td>${new Date(result.date).toLocaleDateString()}</td>
                        <td>${index === 0 ? `<button class="btn btn-sm btn-primary" onclick="exportUserResultsPDF('${user.username}')">Export PDF</button>` : ''}</td>
                    </tr>
                `).join('')
            ).join('')}
        </tbody>
    `;

    document.getElementById('resultsTable').innerHTML = '';
    document.getElementById('resultsTable').appendChild(table);
}

async function loadQuestions() {
    try {
        const response = await fetch('/api/admin/questions', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const questions = await response.json();

        const questionsList = document.getElementById('questionsList');
        questionsList.innerHTML = `
            <h4>Existing Questions</h4>
            <div class="list-group">
                ${questions.map(q => `
                    <div class="list-group-item">
                        <h5>${q.question}</h5>
                        <p>Language: ${q.language}</p>
                        <p>Difficulty: ${q.difficulty}</p>
                        <button class="btn btn-danger btn-sm" onclick="deleteQuestion('${q._id}')">Delete</button>
                    </div>
                `).join('')}
            </div>
        `;
    } catch (error) {
        alert('Error loading questions');
    }
}

async function deleteQuestion(questionId) {
    if (!confirm('Are you sure you want to delete this question?')) return;

    try {
        const response = await fetch(`/api/admin/questions/${questionId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        if (response.ok) {
            loadQuestions();
        } else {
            alert('Error deleting question');
        }
    } catch (error) {
        alert('Error deleting question');
    }
}



