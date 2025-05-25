const nodemailer = require('nodemailer');
require('dotenv').config();

// Create transporter
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Send registration confirmation email
const sendRegistrationEmail = async (username) => {
    try {
        await transporter.sendMail({
            from: process.env.FROM_EMAIL,
            to: username,
            subject: 'Welcome to Quiz App',
            html: `
               <h1>🎉 Welcome to Quiz App!</h1>

<p>Hi there,</p>

<p>Thank you for registering with <strong>Quiz App</strong>! We're excited to have you on board.</p>

<p>With Quiz App, you can:</p>
<ul>
  <li>📚 Take quizzes on various topics</li>
  <li>🧠 Improve your skills with instant feedback</li>
</ul>



<p>Need help or have questions? Contact our support team</a> anytime. <strong>islamsamirul9798@gmail.com</strong></p>

<p>Happy learning and good luck on your quiz journey! 🚀</p>

<p>– The Quiz App Team</p>

            `
        });
        console.log('Registration email sent successfully');
    } catch (error) {
        console.error('Error sending registration email:', error);
    }
};

// Send quiz completion email
const sendQuizResultEmail = async (username, score, totalQuestions, language) => {
    try {
        const percentage = ((score / totalQuestions) * 100).toFixed(1);
        await transporter.sendMail({
            from: process.env.FROM_EMAIL,
            to: username,
            subject: 'Quiz Results',
            html: `
                <h1>Quiz Results</h1>
                <p>Here are your results for the ${language} quiz:</p>
                <ul>
                    <li>Score: ${score}/${totalQuestions}</li>
                    <li>Percentage: ${percentage}%</li>
                </ul>
                <p>Keep practicing to improve your skills!</p>
                <p>Thank you for using Quiz App!</p>
                <p>Best regards,</p>
                <p>– The Quiz App Team</p>
            `
        });
        console.log('Quiz result email sent successfully');
    } catch (error) {
        console.error('Error sending quiz result email:', error);
    }
};

// Send password reset email
const sendPasswordResetEmail = async (email, token) => {
    try {
        const resetUrl = `http://localhost:3000/reset-password?token=${token}`;
        await transporter.sendMail({
            from: process.env.FROM_EMAIL,
            to: email,
            subject: 'Password Reset Request for Quiz App',
            html: `
               <h1>Password Reset Request</h1>

<p>Hi,</p>

<p>You are receiving this because you (or someone else) have requested the reset of the password for your account.</p>

<p>Please click on the following link, or paste this into your browser to complete the process:</p>

<p><a href="${resetUrl}">${resetUrl}</a></p>

<p>If you did not request this, please ignore this email and your password will remain unchanged.</p>

<p>– The Quiz App Team</p>
            `
        });
        console.log('Password reset email sent successfully');
    } catch (error) {
        console.error('Error sending password reset email:', error);
    }
};

module.exports = {
    sendRegistrationEmail,
    sendQuizResultEmail,
    sendPasswordResetEmail
};