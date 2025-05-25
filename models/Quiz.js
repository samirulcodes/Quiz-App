const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
    language: {
        type: String,
        required: true,
        trim: true
    },
    question: {
        type: String,
        required: true
    },
    options: [{
        type: String,
        required: true
    }],
    correctAnswer: {
        type: Number,  // Index of correct option
        required: true
    },
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        default: 'medium'
    },
    explanation: {
        type: String,
        required: true
    }
});

// Static method to get random questions
quizSchema.statics.getRandomQuestions = async function(language, limit = 6) {
    return this.aggregate([
        { $match: { language: language } },
        { $sample: { size: limit } },
        { $project: {
            question: 1,
            options: 1,
            language: 1,
            difficulty: 1,
            correctAnswer: 1,
            timeLimit: { $literal: 300 } // 5 minutes in seconds
        }}
    ]);
};

module.exports = mongoose.model('Quiz', quizSchema);