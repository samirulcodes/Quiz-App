const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const generateQuizCertificate = async (userData) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                layout: 'landscape',
                size: 'A4'
            });

            const fileName = `certificate_${userData.username}_${Date.now()}.pdf`;
            const filePath = path.join(__dirname, '..', 'temp', fileName);

            // Ensure temp directory exists
            const tempDir = path.join(__dirname, '..', 'temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            // Pipe PDF to file
            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);

            // Add fancy border
            doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40)
               .lineWidth(3)
               .stroke();

            // Add certificate title
            doc.fontSize(50)
               .font('Helvetica-Bold')
               .text('Certificate of Completion', { align: 'center', y: 100 });

            // Add decorative line
            doc.moveTo(doc.page.width / 2 - 100, 180)
               .lineTo(doc.page.width / 2 + 100, 180)
               .lineWidth(2)
               .stroke();

            // Add certificate text
            doc.fontSize(24)
               .font('Helvetica')
               .moveDown(2)
               .text('This is to certify that', { align: 'center' })
               .moveDown(0.5)
               .font('Helvetica-Bold')
               .fontSize(32)
               .text(userData.username, { align: 'center' })
               .moveDown(0.5)
               .font('Helvetica')
               .fontSize(24)
               .text('has successfully completed the', { align: 'center' })
               .moveDown(0.5)
               .text(`${userData.language} Programming Quiz`, { align: 'center' })
               .moveDown(0.5)
               .text(`with a score of ${userData.score}/${userData.totalQuestions}`, { align: 'center' })
               .moveDown(0.5)
               .text(`(${Math.round((userData.score / userData.totalQuestions) * 100)}%)`, { align: 'center' });

            // Add date
            doc.fontSize(16)
               .moveDown(2)
               .text(`Date: ${new Date().toLocaleDateString()}`, { align: 'center' });

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
    generateQuizCertificate
};