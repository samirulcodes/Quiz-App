const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const { authenticateToken } = require('./auth');
const User = require('../models/User');
const Quiz = require('../models/Quiz');
const { sendBlockedUserAttemptEmail } = require('../utils/emailService');
const { sendQuizResultEmail } = require('../utils/emailService');
const { generateQuizCertificate } = require('../utils/certificateService');

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
        const { answers, language } = req.body;
        const questionIds = Object.keys(answers);
        
        // Fetch questions to check answers
        const questions = await Quiz.find({ _id: { $in: questionIds } });
        
        let score = 0;
        questions.forEach(question => {
            if (answers[question._id] === question.correctAnswer) {
                score++;
            }
        });

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
        await sendQuizResultEmail(
            req.user.username,
            score,
            questions.length,
            language
        );

        // Generate certificate
        const certificateData = {
            username: req.user.username,
            score,
            totalQuestions: questions.length,
            language
        };
        const { filePath, fileName } = await generateQuizCertificate(certificateData);

        const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000'; // Use environment variable or default to localhost

        res.json({
            score,
            totalQuestions: questions.length,
            percentage: (score / questions.length) * 100,
            certificate: {
                filePath: `${backendUrl}/temp/${fileName}`,
                fileName
                
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error submitting quiz', error: error.message });
    }
});

// Get user's quiz history
router.get('/history', authenticateToken, async (req, res) => {});

// New endpoint to serve certificates
router.get('/certificate/:fileName', (req, res) => {
    const fileName = req.params.fileName;
    const filePath = path.join(__dirname, '..', 'temp', fileName);

    console.log(`Attempting to serve certificate: ${filePath}`);
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

router.get('/history', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        res.json(user.quizResults);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching history', error: error.message });
    }
});

// Admin route to add new questions
router.post('/add-question', authenticateToken, async (req, res) => {
    try {
        // Check if user is admin
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

module.exports = router;