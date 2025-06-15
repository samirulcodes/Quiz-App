const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const { authenticateToken } = require('./auth');
const User = require('../models/User');
const Quiz = require('../models/Quiz');
const { sendBlockedUserAttemptEmail, sendQuizResultEmail } = require('../utils/emailService');
const { generateQuizCertificate } = require('../utils/certificateService');
const { generateFeedback } = require('../utils/aiService');

// Get random questions for a specific programming language
router.get('/questions/:language', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (user.isBlocked) {
            sendBlockedUserAttemptEmail(user.username);
            return res.status(403).json({ message: 'Your account is blocked. You cannot take quizzes.' });
        }
        const questions = await Quiz.getRandomQuestions(req.params.language);
        res.json(questions);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching questions', error: error.message });
    }
});

// Submit quiz answers and get results
router.post('/submit', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (user.isBlocked) {
            sendBlockedUserAttemptEmail(user.username);
            return res.status(403).json({ message: 'Your account is blocked. You cannot submit quiz results.' });
        }

        const { answers, language, isCheatSubmission } = req.body;
        const questionIds = Object.keys(answers);
        const questions = await Quiz.find({ _id: { $in: questionIds } });

        let score = 0;
        let feedbackDetails = {};

        questions.forEach(question => {
            const userAnswer = answers[question._id];
            const isCorrect = userAnswer === question.correctAnswer;

            if (isCorrect) {
                score++;
            } else {
                feedbackDetails[question._id] = {
                    isCorrect: false,
                    userAnswer,
                    correctAnswer: question.correctAnswer,
                    explanation: question.explanation,
                    aiFeedback: null
                };
            }
        });

        // Generate AI feedback for incorrect answers
        for (const questionId in feedbackDetails) {
            const detail = feedbackDetails[questionId];
            const question = questions.find(q => q._id.toString() === questionId);
            if (question) {
                detail.aiFeedback = await generateFeedback(
                    question.question,
                    question.options[detail.userAnswer],
                    question.options[detail.correctAnswer],
                    detail.explanation
                );
            }
        }

        // Save result to user's history
        await User.findByIdAndUpdate(req.user.userId, {
            $push: {
                quizResults: {
                    score,
                    totalQuestions: questions.length,
                    language,
                    date: new Date()
                }
            }
        });

        // Send quiz result email
        if (isCheatSubmission) {
            await sendQuizResultEmail(
                req.user.username,
                score,
                questions.length,
                language,
                true // Indicate cheat submission
            );
        } else {
            await sendQuizResultEmail(
                req.user.username,
                score,
                questions.length,
                language
            );
        }

        // Generate certificate
        const certificateData = {
            username: req.user.username,
            score,
            totalQuestions: questions.length,
            language
        };
        const { filePath, fileName } = await generateQuizCertificate(certificateData);
        const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';

        res.json({
            score,
            totalQuestions: questions.length,
            percentage: (score / questions.length) * 100,
            certificate: {
                filePath: `${backendUrl}/temp/${fileName}`,
                fileName
            },
            feedbackDetails
        });

    } catch (error) {
        res.status(500).json({ message: 'Error submitting quiz', error: error.message });
    }
});

// New endpoint to serve certificates
router.get('/certificate/:fileName', (req, res) => {
    const fileName = req.params.fileName;
    const filePath = path.join(__dirname, '..', 'temp', fileName);


    if (fs.existsSync(filePath)) {
        res.download(filePath, fileName, (err) => {
            if (err) {
                console.error('Error downloading certificate:', err);
                res.status(500).send('Error downloading certificate.');
            }
        });
    } else {
        res.status(404).send('Certificate not found.');
    }
});

// Admin route to add new questions
router.post('/add-question', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }

        const question = new Quiz(req.body);
        await question.save();
        res.status(201).json({ message: 'Question added successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error adding question', error: error.message });
    }
});

// Get leaderboard data
router.get('/leaderboard', async (req, res) => {
    try {
        const users = await User.find({}, 'username quizResults');

        let topPerformers = [];

        users.forEach(user => {
            if (user.quizResults && user.quizResults.length > 0) {
                let bestScore = 0;
                let bestScoreDate = null;

                user.quizResults.forEach(result => {
                    if (result.score > bestScore) {
                        bestScore = result.score;
                        bestScoreDate = result.date;
                    }
                });

                topPerformers.push({
                    username: user.username,
                    bestScore: bestScore,
                    date: bestScoreDate
                });
            }
        });

        // Sort top performers by score (descending)
        topPerformers.sort((a, b) => b.bestScore - a.bestScore);

        // Optionally, limit the number of top performers displayed
        // For example, to show top 10:
        // topPerformers = topPerformers.slice(0, 10);

        res.json(topPerformers);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching leaderboard data', error: error.message });
    }
});

// Admin route to delete a user's quiz results from the leaderboard
router.delete('/leaderboard/:username', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }

        const { username } = req.params;
        const targetUser = await User.findOne({ username });

        if (!targetUser) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Clear all quiz results for the target user
        targetUser.quizResults = [];
        await targetUser.save();

        res.status(200).json({ message: `All quiz results for ${username} deleted successfully.` });
    } catch (error) {
        console.error('Error deleting leaderboard entry:', error);
        res.status(500).json({ message: 'Error deleting leaderboard entry', error: error.message });
    }
});

module.exports = router;