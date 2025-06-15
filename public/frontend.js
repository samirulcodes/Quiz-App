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
        setTimeout(() => {
            if (!user.error) {
                handleLoginSuccess(user);
            } else {
                hideLoadingScreen(); // Hide loading screen if no user is logged in
            }
        }, 1500); // Ensure loading screen is visible for at least 1.5 seconds
    })
    .catch(error => {
        console.error('Error checking login status:', error);
        setTimeout(() => {
            hideLoadingScreen(); // Hide loading screen on error
        }, 1500); // Ensure loading screen is visible for at least 1.5 seconds
    });
} else {
    setTimeout(() => {
        hideLoadingScreen(); // Hide loading screen if no token exists
    }, 2500); // Ensure loading screen is visible for at least 1.5 seconds
}

function hideLoadingScreen() {
    document.getElementById('loadingScreen').style.display = 'none';
    document.getElementById('mainContent').style.display = 'block';
    updateLeaderboardLinkVisibility();
}

function updateLeaderboardLinkVisibility() {
    const authForms = document.getElementById('authForms');
    const quizSection = document.getElementById('quizSection');
    const leaderboardLink = document.getElementById('leaderboardLink');

    if (leaderboardLink) {
        if (authForms && authForms.style.display !== 'none') {
            leaderboardLink.style.display = 'block'; // Show leaderboard link on auth page
        } else if (quizSection && quizSection.style.display !== 'none') {
            leaderboardLink.style.display = 'none'; // Hide leaderboard link when quiz section is active
        } else {
            leaderboardLink.style.display = 'block'; // Default to show if neither is explicitly active (e.g., initial load)
        }
    }
}

// Authentication Functions
async function handleForgotPassword(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const email = formData.get('forgotEmail'); // Get email from the updated form field
    const newPassword = formData.get('newPassword');
    const confirmPassword = formData.get('confirmPassword');

    if (newPassword !== confirmPassword) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Passwords do not match!'
        });
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
            Swal.fire({
                icon: 'success',
                title: 'Success',
                text: 'Password updated successfully! Please login.'
            });
            document.querySelector('[href="#login"]').click();
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Login Failed',
                text: data.message
            });
        }
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error resetting password'
        });
    }
    return false;
}

async function handleLogin(event) {
    event.preventDefault();

    const loginButton = document.getElementById('loginButton');
    const loginButtonText = document.getElementById('loginButtonText');
    const loginSpinner = document.getElementById('loginSpinner');

    // Show spinner and disable button
    loginButton.disabled = true;
    loginButtonText.style.display = 'none';
    loginSpinner.style.display = 'inline-block';

    const formData = new FormData(event.target);
    
    try {
        // Simulate a 1-2 second delay
        await new Promise(resolve => setTimeout(resolve, 1500)); 

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
            currentUser = data.user; // Set currentUser here
            setTimeout(() => {
                showLockAnimation();
            }, 1000); // Add a 1s delay
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Login Failed',
                text: data.message
            });
        }
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error logging in'
        });
    } finally {
        // Hide spinner and re-enable button
        loginButton.disabled = false;
        loginButtonText.style.display = 'inline';
        loginSpinner.style.display = 'none';
    }
    return false;
}

// Password validation
const registerPassword = document.getElementById('registerPassword');
const registerButton = document.getElementById('registerButton');

registerPassword.addEventListener('input', validatePassword);

function validatePassword() {
    const password = registerPassword.value;
    
    // Define validation criteria
    const validations = {
        'length-check': password.length >= 8,
        'uppercase-check': /[A-Z]/.test(password),
        'lowercase-check': /[a-z]/.test(password),
        'number-check': /[0-9]/.test(password),
        'symbol-check': /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    let allValid = true;

    // Update UI for each requirement
    Object.entries(validations).forEach(([requirement, isValid]) => {
        const element = document.getElementById(requirement);
        const icon = element.querySelector('i');

        if (isValid) {
            element.classList.add('valid');
            icon.classList.remove('bi-x-circle', 'text-danger');
            icon.classList.add('bi-check-circle');
        } else {
            element.classList.remove('valid');
            icon.classList.remove('bi-check-circle');
            icon.classList.add('bi-x-circle', 'text-danger');
            allValid = false;
        }
    });

    // Enable/disable register button
    registerButton.disabled = !allValid;
}

// Update handleRegister function
async function handleRegister(event) {
    event.preventDefault();

    const registerButton = document.getElementById('registerButton');
    const registerButtonText = document.getElementById('registerButtonText');
    const registerSpinner = document.getElementById('registerSpinner');

    // Show spinner and disable button
    registerButton.disabled = true;
    registerButtonText.style.display = 'none';
    registerSpinner.style.display = 'inline-block';

    const formData = new FormData(event.target);
    const password = formData.get('password');

    // Validate password before submitting
    const validations = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        symbol: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    if (!Object.values(validations).every(Boolean)) {
        Swal.fire({
            icon: 'warning',
            title: 'Password Requirements',
            text: 'Please ensure your password meets all requirements.'
        });
        // Hide spinner and re-enable button immediately if validation fails
        registerButton.disabled = false;
        registerButtonText.style.display = 'inline';
        registerSpinner.style.display = 'none';
        return false;
    }

    try {
        // Simulate a 1-2 second delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: formData.get('email'),
                password: password
            })
        });

        const data = await response.json();
        if (response.ok) {
            Swal.fire({
            icon: 'success',
            title: 'Registration Successful',
            text: 'Registration successful! Please login.'
        });
            document.querySelector('[href="#login"]').click();
        } else {
            Swal.fire({
            icon: 'error',
            title: 'Registration Failed',
            text: data.message || 'Registration failed'
        });
        }
    } catch (error) {
        console.error('Registration error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Registration Failed',
            text: 'Registration failed. Please try again.'
        });
    } finally {
        // Hide spinner and re-enable button
        registerButton.disabled = false;
        registerButtonText.style.display = 'inline';
        registerSpinner.style.display = 'none';
    }
    return false;
}

function showLockAnimation() {
    const loginForm = document.getElementById('authForms');
    const lockAnimation = document.getElementById('lockAnimation');
    const verifyingText = document.createElement('p');
    verifyingText.id = 'verifyingText';
    verifyingText.textContent = 'Verifying...';
    verifyingText.style.textAlign = 'center';
    verifyingText.style.marginTop = '20px';
    verifyingText.style.fontSize = '1.2em';
    verifyingText.style.color = '#000';
    verifyingText.style.position = 'absolute';
    verifyingText.style.top = '50%';
    verifyingText.style.left = '50%';
    verifyingText.style.transform = 'translate(-50%, -50%)';
    verifyingText.style.zIndex = '1001';
    verifyingText.style.display = 'block'; // Ensure it's visible

    loginForm.style.display = 'none';
    lockAnimation.style.display = 'block';
    lockAnimation.parentNode.insertBefore(verifyingText, lockAnimation);

    // Play the animation
    const lottiePlayer = lockAnimation.querySelector('lottie-player');
    if (lottiePlayer) {
        lottiePlayer.play();
        // Listen for the 'complete' event of the Lottie animation
        lottiePlayer.addEventListener('complete', () => {
            // Ensure the animation plays for at least 2 seconds, even if it's shorter
            setTimeout(() => {
                lockAnimation.style.display = 'none';
                verifyingText.remove();
                handleLoginSuccess(currentUser);
            }, 2000); // Minimum 2 seconds display for animation and text

        }, { once: true });
    } else {
        // Fallback if lottie-player is not found
        setTimeout(() => {
            lockAnimation.style.display = 'none';
            verifyingText.remove();
            handleLoginSuccess(currentUser);
        }, 2000); // Fallback delay
    }
}


function handleLoginSuccess(user) {
    currentUser = user;
    setTimeout(() => {
        hideLoadingScreen(); // Hide loading screen after successful login
    }, 1500); // Ensure loading screen is visible for at least 1.5 seconds
    document.getElementById('authForms').style.display = 'none';
    document.getElementById('quizSection').style.display = 'block';
    document.getElementById('username').textContent = `Welcome, ${user.username}!`;
    Swal.fire({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        icon: 'success',
        title: `Welcome back, ${user.username}!`
    });
    document.getElementById('userSection').style.display = 'block';

    // Display badges if any
    const userBadgesContainer = document.getElementById('userBadges');
    userBadgesContainer.innerHTML = ''; // Clear previous badges
    if (user.badges && user.badges.length > 0) {
        user.badges.forEach(badge => {
            const badgeSpan = document.createElement('span');
            badgeSpan.className = 'badge bg-info text-dark me-1';
            badgeSpan.textContent = badge;
            userBadgesContainer.appendChild(badgeSpan);
        });
    }

    // Check if the user is an admin and show admin section
    if (user.role === 'admin') {
        document.getElementById('adminSection').style.display = 'block';
        document.getElementById('quizSection').style.display = 'none'; // Hide quiz section for admin
        loadAdminDashboard(); // Load admin dashboard if user is admin
    } else {
        document.getElementById('adminSection').style.display = 'none';
        showLanguageSelection(); // Show language selection for regular users
    }
}


function showLockAnimation() {
    const loginForm = document.getElementById('login');
    const lockAnimation = document.getElementById('lockAnimation');

    loginForm.style.display = 'none';
    lockAnimation.style.display = 'block';

    lockAnimation.addEventListener('complete', () => {
        lockAnimation.style.display = 'none';
        // Assuming user data is available globally or can be fetched
        // For now, let's just call handleLoginSuccess with a dummy user
        handleLoginSuccess(currentUser); 
    }, { once: true });

    lockAnimation.play();
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
        Swal.fire({
            icon: 'warning',
            title: 'Search Error',
            text: 'Please enter a username to search.'
        });
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
function showLoadingScreen() {
    document.getElementById('loadingScreen').style.display = 'flex';
    document.getElementById('mainContent').style.display = 'none';
}

async function startQuiz(language) {
    showLoadingScreen();
    try {
        const response = await fetch(`/api/quiz/questions/${language}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const questions = await response.json();
        
        if (questions.length === 0) {
            Swal.fire({
            icon: 'info',
            title: 'No Questions',
            text: 'No questions available for this language'
        });
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
        setTimeout(() => {
            hideLoadingScreen();
        }, 1500);
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Quiz Error',
            text: 'Error starting quiz'
        });
        setTimeout(() => {
            hideLoadingScreen();
        }, 1500);
    }
}

let tabSwitchCount = 0;
const maxTabSwitches = 3; // Define a maximum allowed tab switches

function setupCheatDetection() {
    // Detect if the window loses focus (user switches tabs or clicks outside)
    window.addEventListener('blur', handleWindowBlur);
    // Detect if the window gains focus back
    window.addEventListener('focus', handleWindowFocus);
    // Detect if the document's visibility changes (e.g., tab switched, app minimized)
    document.addEventListener('visibilitychange', handleVisibilityChange);
}

function handleWindowBlur() {
    // This function is primarily for desktop browser tab/window switching.
    // For mobile or more robust detection, handleVisibilityChange is used.
    // We can still keep this for broader compatibility, but the main logic
    // for tab switching detection will be in handleVisibilityChange.
    // console.warn('Window blur detected.'); // Optional: keep for debugging
}

function handleVisibilityChange() {
    if (document.visibilityState === 'hidden') {
        // The tab has become hidden
        if (currentQuiz && timer) { // Only track during an active quiz
            tabSwitchCount++;
            console.warn(`Tab switch detected via visibilitychange. Count: ${tabSwitchCount}`);

            if (tabSwitchCount >= maxTabSwitches) {
                Swal.fire({
            icon: 'warning',
            title: 'Tab Switch Limit Reached',
            text: `You have switched tabs ${maxTabSwitches} times. The quiz will now be submitted.`,
            showConfirmButton: false,
            timer: 3000
        });
                submitQuiz(true);
            } else {
                const ordinalSuffix = (count) => {
                    const j = count % 10, k = count % 100;
                    if (j === 1 && k !== 11) return count + "st";
                    if (j === 2 && k !== 12) return count + "nd";
                    if (j === 3 && k !== 13) return count + "rd";
                    return count + "th";
                };
                Swal.fire({
            icon: 'warning',
            title: 'Tab Switch Warning',
            text: `Warning: Switching tabs is not allowed during the quiz. You have switched tabs ${ordinalSuffix(tabSwitchCount)} time${tabSwitchCount > 1 ? 's' : ''}. You have ${maxTabSwitches - tabSwitchCount} attempt${maxTabSwitches - tabSwitchCount !== 1 ? 's' : ''} left before auto-submission.`,
            showConfirmButton: false,
            timer: 5000
        });
            }
        }
    } else {
        // The tab has become visible
        handleWindowFocus(); // Call focus handler when tab becomes visible
    }
}

function handleWindowFocus() {
    if (currentQuiz && timer) { // Only resume if a quiz is active
        console.log('Window focused or tab became visible.');
        // Optionally resume the timer if it was paused
        // startTimer(); // Example: resume timer (need to handle remaining time)
    }
}

// Remember to remove event listeners when the quiz finishes or user logs out
function removeCheatDetection() {
    window.removeEventListener('blur', handleWindowBlur);
    window.removeEventListener('focus', handleWindowFocus);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
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

    document.getElementById('nextButton').style.display = 'block'; // Ensure next button is visible

    document.getElementById('prevButton').style.display = (currentQuestionIndex > 0) ? 'block' : 'none';
    
    // Update next button text for last question
    const nextButton = document.getElementById('nextButton');
    if (currentQuestionIndex === totalQuestions - 1) {
        nextButton.textContent = 'Finish Quiz';
    } else {
        nextButton.textContent = 'Next Question';
    }

    document.getElementById('prevButton').style.display = (currentQuestionIndex > 0) ? 'block' : 'none';
}

function selectOption(optionIndex) {
    const questionId = currentQuiz.questions[currentQuestionIndex]._id;
    userAnswers[questionId] = optionIndex;

    const options = document.getElementById('options').children;
    for (let button of options) {
        button.classList.remove('selected');
    }
    options[optionIndex].classList.add('selected');



    document.getElementById('prevButton').style.display = (currentQuestionIndex > 0) ? 'block' : 'none';
document.getElementById('nextButton').addEventListener('click', handleNextQuestion);
document.getElementById('prevButton').addEventListener('click', handlePreviousQuestion);
document.getElementById('prevButton').addEventListener('click', handlePreviousQuestion);
}

function handlePreviousQuestion() {
    currentQuestionIndex--;
    showQuestion();
}

function handlePreviousQuestion() {
    currentQuestionIndex--;
    showQuestion();
}

function handleNextQuestion() {
    if (currentQuestionIndex < currentQuiz.questions.length - 1) {
        currentQuestionIndex++;
        showQuestion();
    } else {
        const totalQuestions = currentQuiz.questions.length;
        const answeredQuestions = Object.keys(userAnswers).length;

        if (answeredQuestions < totalQuestions) {
            const unansweredQuestionNumbers = [];
            for (let i = 0; i < totalQuestions; i++) {
                const questionId = currentQuiz.questions[i]._id;
                if (!(questionId in userAnswers)) {
                    unansweredQuestionNumbers.push(i + 1);
                }
            }
            if (confirm(`You have not answered question(s) ${unansweredQuestionNumbers.join(', ')}. Do you still want to submit the quiz?`)) {
                if (confirm('Are you sure you want to finish the quiz?')) {
                    submitQuiz(false);
                }
            }
        } else {
            if (confirm('Are you sure you want to finish the quiz?')) {
                submitQuiz(false);
            }
        }
    }
}

async function submitQuiz(isCheat = false) {
    try {
        const response = await fetch('/api/quiz/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                answers: userAnswers,
                language: currentQuiz.language,
                isCheatSubmission: isCheat
            })
        });

        const result = await response.json();
        showResults(result);
        Swal.fire({
            icon: 'success',
            title: 'Quiz Submitted!',
            text: 'Quiz submitted successfully!'
        });
        removeCheatDetection(); // Remove listeners after quiz submission
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Submission Error',
            text: 'Error submitting quiz'
        });
    }
}

function showResults(result) {
    clearInterval(timer);
    document.getElementById('quizContent').style.display = 'none';
    document.getElementById('resultSection').style.display = 'block';
    document.getElementById('score').textContent = result.score;
    document.getElementById('totalQuestions').textContent = result.totalQuestions;
    document.getElementById('percentage').textContent = result.percentage.toFixed(1);



    const feedbackContainer = document.getElementById('feedbackContainer');
    feedbackContainer.innerHTML = ''; // Clear previous feedback

    if (result.feedbackDetails && Object.keys(result.feedbackDetails).length > 0) {
        const feedbackTitle = document.createElement('h4');
        feedbackTitle.textContent = 'Detailed Feedback';
        feedbackContainer.appendChild(feedbackTitle);

        for (const questionId in result.feedbackDetails) {
            const feedback = result.feedbackDetails[questionId];
            const question = currentQuiz.questions.find(q => q._id === questionId);

            if (question && feedback.aiFeedback) {
                const feedbackCard = document.createElement('div');
                feedbackCard.className = 'card mb-3';
                feedbackCard.innerHTML = `
                    <div class="card-body">
                        <h5 class="card-title">Question: ${question.question}</h5>
                        <p class="card-text text-danger">Your Answer: ${question.options[feedback.userAnswer]}</p>
                        <p class="card-text text-success">Correct Answer: ${question.options[feedback.correctAnswer]}</p>
                        <p class="card-text"><strong>Explanation:</strong> ${feedback.aiFeedback.detailedExplanation}</p>
                        <h6>Suggested Resources:</h6>
                        <ul>
                            ${feedback.aiFeedback.suggestedResources.map(res => `<li><a href="${res.url}" target="_blank">${res.name}</a></li>`).join('')}
                        </ul>
                    </div>
                `;
                feedbackContainer.appendChild(feedbackCard);
            }
        }
    }

    // Add certificate download link if available
    if (result.certificate && result.certificate.filePath && result.certificate.fileName) {
        const certificateLink = document.createElement('a');
        certificateLink.href = result.certificate.filePath;
        certificateLink.textContent = 'Download Certificate';
        certificateLink.className = 'btn btn-success mt-3'; // Add some styling
        document.getElementById('resultSection').appendChild(certificateLink);
    }

    // Append the feedback container to the result section
    document.getElementById('resultSection').appendChild(feedbackContainer);
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
            submitQuiz(false); // Auto-submit when time runs out
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
        Swal.fire({
            icon: 'error',
            title: 'Export Error',
            text: 'Error exporting PDF: ' + error.message
        });
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
        Swal.fire({
            icon: 'error',
            title: 'Statistics Error',
            text: 'Error loading statistics'
        });
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
            Swal.fire({
            icon: 'success',
            title: 'Success',
            text: 'Question added successfully!'
        });
            event.target.reset();
            loadQuestions(); // Reload questions list
        } else {
            Swal.fire({
            icon: 'error',
            title: 'Error',
            text: result.message || 'Error adding question'
        });
        }
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error adding question'
        });
    }
}

async function loadUserResults() {
    try {
        const response = await fetch('/api/admin/results', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const users = await response.json();

        const table = document.createElement('table');
        table.className = 'table table-striped table-responsive';
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
                            <td data-label="Username">${user.username}</td>
                            <td data-label="Language">${result.language}</td>
                            <td data-label="Score">${result.score}/${result.totalQuestions}</td>
                            <td data-label="Date">${new Date(result.date).toLocaleDateString()}</td>
                        </tr>
                    `).join('')
                ).join('')}
            </tbody>
        `;

        document.getElementById('resultsTable').innerHTML = '';
        displayUserResults(users);
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error loading user results'
        });
    }
}

function displayUserResults(users) {
    const table = document.createElement('table');
    table.className = 'table table-striped table-responsive';
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
                        <td>
                            ${user.username}
                            ${user.isBlocked ? 
                                `<button class="btn btn-sm btn-success ms-2" onclick="unblockUser('${user.username}')">Unblock</button>` : 
                                `<button class="btn btn-sm btn-warning ms-2" onclick="blockUser('${user.username}')">Block</button>`
                            }
                        </td>
                        <td>${result.language}</td>
                        <td>${result.score}/${result.totalQuestions}</td>
                        <td>${new Date(result.date).toLocaleDateString()}</td>
                        <td>
                            ${index === 0 ? `<button class="btn btn-sm btn-primary me-2" onclick="exportUserResultsPDF('${user.username}')">Export PDF</button>` : ''}
                            <button class="btn btn-sm btn-danger" onclick="deleteQuizResult('${user.username}', '${result._id}')">Delete Result</button>
                        </td>
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
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error loading questions'
        });
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
            Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error deleting question'
        });
        }
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error deleting question'
        });
    }
}

async function deleteQuizResult(username, resultId) {
    if (!confirm(`Are you sure you want to delete this quiz result for ${username}?`)) return;

    console.log(`Attempting to delete quiz result for user: ${username}, result ID: ${resultId}`);
    try {
        const response = await fetch(`/api/admin/results/${username}/${resultId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        if (response.ok) {
            Swal.fire({
            icon: 'success',
            title: 'Success',
            text: 'Quiz result deleted successfully.'
        });
            loadUserResults(); // Reload user results after deletion
        } else {
            const errorData = await response.json();
            Swal.fire({
            icon: 'error',
            title: 'Error',
            text: `Error deleting quiz result: ${errorData.message || response.statusText}`
        });
        }
    } catch (error) {
        console.error('Error deleting quiz result:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'An unexpected error occurred while deleting the quiz result.'
        });
    }
}

async function blockUser(username) {
    if (!confirm(`Are you sure you want to block user ${username}?`)) return;

    try {
        const response = await fetch(`/api/admin/users/${username}/block`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const result = await response.json();
        if (response.ok) {
            Swal.fire({
            icon: 'success',
            title: 'Success',
            text: result.message || `User ${username} blocked successfully.`
        });
            loadUserResults(); // Reload the user results table to reflect the change
        } else {
            Swal.fire({
            icon: 'error',
            title: 'Error',
            text: result.message || 'Error blocking user.'
        });
        }
    } catch (error) {
        console.error('Error blocking user:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'An error occurred while trying to block the user.'
        });
    }
}

async function unblockUser(username) {
    if (!confirm(`Are you sure you want to unblock user ${username}?`)) return;

    try {
        const response = await fetch(`/api/admin/users/${username}/unblock`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const result = await response.json();
        if (response.ok) {
            Swal.fire({
            icon: 'success',
            title: 'Success',
            text: result.message || `User ${username} unblocked successfully.`
        });
            loadUserResults(); // Reload the user results table to reflect the change
        } else {
            Swal.fire({
            icon: 'error',
            title: 'Error',
            text: result.message || 'Error unblocking user.'
        });
        }
    } catch (error) {
        console.error('Error unblocking user:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'An error occurred while trying to unblock the user.'
        });
    }
}