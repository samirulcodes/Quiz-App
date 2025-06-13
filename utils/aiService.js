require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

async function generateFeedback(question, userAnswer, correctAnswer, explanation) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest"});

        const prompt = `Given the following:
Question: ${question}
Your Answer: ${userAnswer}
Correct Answer: ${correctAnswer}
Explanation: ${explanation}

Please provide detailed feedback on the user's answer, explain why the correct answer is right, and suggest resources for further reading.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Basic parsing of the generated text to extract detailed explanation and suggested resources
        let detailedExplanation = text;
        let suggestedResources = [];

        // You might need more sophisticated parsing here depending on the AI's output format
        // For now, let's assume the AI provides a coherent block of text.

        return {
            detailedExplanation: detailedExplanation,
            suggestedResources: suggestedResources
        };
    } catch (error) {
        console.error("Error generating feedback with Gemini API:", error);
        // Fallback to default feedback if AI generation fails
        let feedback = `You answered: "${userAnswer}". The correct answer was: "${correctAnswer}".\n\n`;
        feedback += `Explanation: ${explanation}\n\n`;
        feedback += `For further reading, consider these resources: [Link 1], [Link 2].`;

        return {
            detailedExplanation: feedback,
            suggestedResources: [
                { name: `Search: ${question}`, url: `https://www.google.com/search?q=${encodeURIComponent(question)}` },
                { name: `Search: ${correctAnswer}`, url: `https://www.google.com/search?q=${encodeURIComponent(correctAnswer)}` }
            ]
        };
    }
}

module.exports = {
    generateFeedback
};