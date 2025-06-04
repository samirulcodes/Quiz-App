const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Quiz = require('../models/Quiz');
const { authenticateToken } = require('./auth');
const { generateUserResultsPDF } = require('../utils/pdfService');
const path = require('path');

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.userId);
        if (user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }
        next();
    } catch (error) {
        res.status(500).json({ message: 'Error checking admin status', error: error.message });
    }
};

// Get all users' quiz results
router.get('/results', authenticateToken, isAdmin, async (req, res) => {
    try {
        const users = await User.find({}, 'username quizResults isBlocked');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching results', error: error.message });
    }
});

// Get results filtered by date range
router.get('/results/filter', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const users = await User.find({
            'quizResults.date': {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        }, 'username quizResults');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error filtering results', error: error.message });
    }
});

// Search user results by username
router.get('/results/search', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { username } = req.query;
        if (!username) {
            return res.status(400).json({ message: 'Username is required' });
        }
        // Use a case-insensitive regex for partial matching
        const users = await User.find({ username: { $regex: username, $options: 'i' } }, 'username quizResults');
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error searching user results', error: error.message });
    }
});

// Get all questions
router.get('/questions', authenticateToken, isAdmin, async (req, res) => {
    try {
        const questions = await Quiz.find();
        res.json(questions);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching questions', error: error.message });
    }
});

// Update a question
router.put('/questions/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const question = await Quiz.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        res.json(question);
    } catch (error) {
        res.status(500).json({ message: 'Error updating question', error: error.message });
    }
});

// Delete a question
router.delete('/questions/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        await Quiz.findByIdAndDelete(req.params.id);
        res.json({ message: 'Question deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting question', error: error.message });
    }
});

// Export user results as PDF
router.get('/results/export/:username', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { username } = req.params;
        const user = await User.findOne({ username });
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const userData = {
            username: user.username,
            quizResults: user.quizResults
        };

        const { filePath, fileName } = await generateUserResultsPDF(userData);

        // Set headers for file download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);

        // Send the file
        res.sendFile(filePath, (err) => {
            if (err) {
                console.error('Error sending file:', err);
                res.status(500).json({ message: 'Error sending PDF' });
            }
            // Delete the temporary file after sending
            setTimeout(() => {
                try {
                    require('fs').unlinkSync(filePath);
                } catch (unlinkError) {
                    console.error('Error deleting temporary file:', unlinkError);
                }
            }, 1000);
        });
    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).json({ message: 'Error generating PDF', error: error.message });
    }
});

// Get quiz statistics
router.get('/statistics', authenticateToken, isAdmin, async (req, res) => {
    try {
        const users = await User.find({}, 'username quizResults isBlocked');
        
        // Calculate statistics
        let totalScore = 0;
        let totalQuizzes = 0;
        let topPerformers = [];
        
        users.forEach(user => {
            if (user.quizResults && user.quizResults.length > 0) {
                user.quizResults.forEach(result => {
                    totalScore += result.score;
                    totalQuizzes++;
                });
                
                // Get user's best score
                const bestScore = Math.max(...user.quizResults.map(r => r.score));
                topPerformers.push({
                    username: user.username,
                    bestScore: bestScore
                });
            }
        });
        
        // Sort top performers by score (descending)
        topPerformers.sort((a, b) => b.bestScore - a.bestScore);
        
        // Get top 5 performers
        topPerformers = topPerformers.slice(0, 5);
        
        const statistics = {
            averageScore: totalQuizzes > 0 ? (totalScore / totalQuizzes).toFixed(2) : 0,
            totalQuizzesTaken: totalQuizzes,
            topPerformers: topPerformers
        };
        
        res.json(statistics);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching statistics', error: error.message });
    }
});

// Delete a specific quiz result for a user
router.delete('/results/:username/:resultId', authenticateToken, isAdmin, async (req, res) => {
    console.log(`DELETE /api/admin/results/${req.params.username}/${req.params.resultId} received`);
    try {
        const { username, resultId } = req.params;

        const user = await User.findOne({ username });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const initialLength = user.quizResults.length;
        user.quizResults = user.quizResults.filter(result => result._id.toString() !== resultId);

        if (user.quizResults.length === initialLength) {
            return res.status(404).json({ message: 'Quiz result not found for this user' });
        }

        await user.save();
        res.json({ message: 'Quiz result deleted successfully' });
    } catch (error) {
        console.error('Error deleting quiz result:', error);
        res.status(500).json({ message: 'Error deleting quiz result', error: error.message });
    }
});

// Add a new question
router.post('/questions', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { language, question, options, correctAnswer, difficulty, explanation } = req.body;

        // Validate required fields
        if (!language || !question || !options || correctAnswer === undefined || !difficulty) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Validate options array
        if (!Array.isArray(options) || options.length !== 4) {
            return res.status(400).json({ message: 'Four options are required' });
        }

        // Create new question
        const newQuestion = new Quiz({
            language,
            question,
            options,
            correctAnswer,
            difficulty,
            explanation
        });

        await newQuestion.save();
        res.status(201).json(newQuestion);
    } catch (error) {
        res.status(500).json({ message: 'Error creating question', error: error.message });
    }
});

// Get a specific user's quiz results with correct and wrong answers
router.get('/user-quiz-details/:userId', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId, 'username quizResults');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user quiz details', error: error.message });
    }
});

// Block a user
router.put('/users/:username/block', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { username } = req.params;
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.isBlocked = true;
        await user.save();

        res.json({ message: `User ${username} has been blocked.` });
    } catch (error) {
        console.error('Error blocking user:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Unblock a user
router.put('/users/:username/unblock', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { username } = req.params;
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.isBlocked = false;
        await user.save();

        res.json({ message: `User ${username} has been unblocked.` });
    } catch (error) {
        console.error('Error unblocking user:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;