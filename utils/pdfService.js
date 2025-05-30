const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const generateUserResultsPDF = async (userData) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument();
            const fileName = `quiz_results_${userData.username}_${Date.now()}.pdf`;
            const filePath = path.join(__dirname, '..', 'temp', fileName);

            // Ensure temp directory exists
            const tempDir = path.join(__dirname, '..', 'temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            // Pipe PDF to file
            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);

            // Add header
            doc.fontSize(20)
               .text('Quiz Results Report', { align: 'center' })
               .moveDown();

            // Add user info
            doc.fontSize(14)
               .text(`User: ${userData.username}`, { align: 'left' })
               .text(`Report Generated: ${new Date().toLocaleDateString()}`, { align: 'left' })
               .moveDown();

            // Add results table header
            doc.fontSize(12)
               .text('Quiz Results:', { underline: true })
               .moveDown(0.5);

            // Add results
            userData.quizResults.forEach((result, index) => {
                doc.fontSize(10)
                   .text(`Quiz ${index + 1}:`, { continued: true })
                   .text(`  Language: ${result.language}`, { continued: true })
                   .text(`  Score: ${result.score}/${result.totalQuestions}`, { continued: true })
                   .text(`  Date: ${new Date(result.date).toLocaleDateString()}`)
                   .moveDown(0.5);
            });

            // Add summary
            doc.moveDown()
               .fontSize(12)
               .text('Summary:', { underline: true })
               .moveDown(0.5);

            const totalQuizzes = userData.quizResults.length;
            const totalScore = userData.quizResults.reduce((sum, result) => sum + result.score, 0);
            const totalQuestions = userData.quizResults.reduce((sum, result) => sum + result.totalQuestions, 0);
            const averageScore = ((totalScore / totalQuestions) * 100).toFixed(2);

            doc.fontSize(10)
               .text(`Total Quizzes Taken: ${totalQuizzes}`)
               .text(`Average Score: ${averageScore}%`)
               .moveDown();

            // Add footer
            doc.fontSize(8)
               .text('Generated by Quiz App', { align: 'center', color: 'grey' });

            // Finalize PDF
            doc.end();

            stream.on('finish', () => {
                resolve({
                    filePath,
                    fileName
                });
            });

            stream.on('error', (error) => {
                reject(error);
            });

        } catch (error) {
            reject(error);
        }
    });
};

module.exports = {
    generateUserResultsPDF
};