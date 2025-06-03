const express = require('express');
const router = express.Router();
const Quiz = require('../models/Quiz');
const User = require('../models/User');
const { authenticateToken } = require('./auth');
const { sendQuizResultEmail } = require('../utils/emailService');
const { generateQuizCertificate } = require('../utils/certificateService');

// Get random questions for a specific programming language
router.get('/questions/:language', authenticateToken, async (req, res) => {
    try {
        const questions = await Quiz.getRandomQuestions(req.params.language);
        res.json(questions);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching questions', error: error.message });
    }
});

// Submit quiz answers and get results
router.post('/submit', authenticateToken, async (req, res) => {
    try {
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

        // Award badges based on quiz performance
        await awardBadges(req.user.userId, score, questions.length, language);

        res.json({
            score,
            totalQuestions: questions.length,
            percentage: (score / questions.length) * 100,
            certificate: {
                filePath: `${process.env.BACKEND_URL}/temp/${fileName}`,
                fileName
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error submitting quiz', error: error.message });
    }
});

// Function to award badges
async function awardBadges(userId, score, totalQuestions, language) {
    try {
        const user = await User.findById(userId);
        if (!user) return;

        let newBadges = [];

        // Badge: First Quiz Completed
        if (user.quizResults.length === 1) { // Check if this is their first quiz result
            if (!user.badges.includes('First Quiz Completed')) {
                newBadges.push('First Quiz Completed');
            }
        }

        // Badge: Quiz Master (e.g., score 80% or more)
        const percentage = (score / totalQuestions) * 100;
        if (percentage >= 80) {
            const badgeName = `${language} Quiz Master`;
            if (!user.badges.includes(badgeName)) {
                newBadges.push(badgeName);
            }
        }

        // Badge: Perfect Score
        if (score === totalQuestions && totalQuestions > 0) {
            if (!user.badges.includes('Perfect Score')) {
                newBadges.push('Perfect Score');
            }
        }

        if (newBadges.length > 0) {
            await User.findByIdAndUpdate(userId, { $addToSet: { badges: { $each: newBadges } } });
            console.log(`User ${user.username} earned new badges: ${newBadges.join(', ')}`);
        }

    } catch (error) {
        console.error('Error awarding badges:', error);
    }
}

// Get user's quiz history
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