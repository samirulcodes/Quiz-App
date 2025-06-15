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
            subject: '🎉 Welcome to Quiz App – Let’s Get Quizzing!',
            html: `
              <div style="font-family: Arial, sans-serif; color: #333;">
                <h1 style="color: #4CAF50;">🎉 Welcome to Quiz App! 🎉</h1>
            
                <p>Hi <strong>there</strong>,</p>
            
                <p>Thank you for registering with <strong>Quiz App</strong>! We're thrilled to have you join our learning community.</p>
            
                <p>With <strong>Quiz App</strong>, you can:</p>
                <ul>
                  <li>📚 Take quizzes across multiple categories</li>
                  <li>🧠 Get AI-based instant feedback to improve your skills</li>
                  <li>🏆 Track your progress and become a top scorer</li>
                
                </ul>
            
                <p>👉 <a href="https://quiz-app-j251.onrender.com/" style="color: #4CAF50;">Start your first quiz now!</a></p>
            
                <hr style="margin: 20px 0;" />
            
                <p>Need help or have questions? Reach out to our support team anytime at: 
                  <a href="mailto:islamsamirul9798@gmail.com">islamsamirul9798@gmail.com</a>
                </p>
            
                <p>Happy learning and good luck on your quiz journey! 🚀</p>
            
                <p style="margin-top: 30px;">– The <strong>Quiz App</strong> Team</p>
            
                <p style="font-size: 12px; color: #888;">You’re receiving this email because you signed up on our platform. If this wasn't you, please ignore this message.</p>
              </div>
            `
            

            
        });
        console.log('Registration email sent successfully');
    } catch (error) {
        console.error('Error sending registration email:', error);
    }
};

// Send quiz completion email
const sendQuizResultEmail = async (username, score, totalQuestions, language, isCheatSubmission = false) => {
    try {
        const percentage = ((score / totalQuestions) * 100).toFixed(1);
        await transporter.sendMail({
            from: process.env.FROM_EMAIL,
            to: username,
         subject: '🎯 Your Quiz Results Are In!',
html: `
  <div style="font-family: Arial, sans-serif; color: #333; padding: 20px; border: 1px solid #eee; border-radius: 10px; background: #f9f9f9;">
    <h1 style="color: #4CAF50; text-align: center;">📊 Quiz Results</h1>

    <p>Hi there,</p>
    <p>Thanks for completing the <strong>${language}</strong> quiz! Here’s how you did:</p>

    <table style="width: 100%; max-width: 400px; margin: 20px auto; border-collapse: collapse;">
      <tr>
        <td style="padding: 10px; font-weight: bold;">✅ Score:</td>
        <td style="padding: 10px;">${score} / ${totalQuestions}</td>
      </tr>
      <tr>
        <td style="padding: 10px; font-weight: bold;">📈 Percentage:</td>
        <td style="padding: 10px;">${percentage}%</td>
      </tr>
    </table>

    ${
      isCheatSubmission 
        ? '<p style="color: red; font-weight: bold; text-align: center;">⚠️ This quiz was auto-submitted due to excessive tab switching (cheat detection).</p>'
        : '<p style="text-align: center;">💪 Great effort! Keep practicing to sharpen your skills.</p>'
    }

    <p style="text-align: center;">
      <a href="https://yourquizapp.com/quizzes" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px;">Take Another Quiz</a>
    </p>

    <hr style="margin: 30px 0;" />

    <p>If you have any questions or need help, feel free to reach out to us at <a href="mailto:islamsamirul9798@gmail.com">islamsamirul9798@gmail.com</a>.</p>

    <p>Happy learning! 🚀</p>
    <p>– The <strong>Quiz App</strong> Team</p>

    <p style="font-size: 12px; color: #888; text-align: center; margin-top: 30px;">
      You're receiving this email because you took a quiz on Quiz App.
    </p>
  </div>
`

        });
        console.log('Quiz result email sent successfully');
    } catch (error) {
        console.error('Error sending quiz result email:', error);
    }
};

// // Send password reset email
// const sendPasswordResetEmail = async (email, token) => {
//     try {
//         const resetUrl = `http://localhost:3000/reset-password?token=${token}`;
//         await transporter.sendMail({
//             from: process.env.FROM_EMAIL,
//             to: email,
//             subject: 'Password Reset Request for Quiz App',
//             html: `
//                <h1>Password Reset Request</h1>

// <p>Hi,</p>

// <p>You are receiving this because you (or someone else) have requested the reset of the password for your account.</p>

// <p>Please click on the following link, or paste this into your browser to complete the process:</p>

// <p><a href="${resetUrl}">${resetUrl}</a></p>

// <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>

// <p>– The Quiz App Team</p>
//             `
//         });
//         console.log('Password reset email sent successfully');
//     } catch (error) {
//         console.error('Error sending password reset email:', error);
//     }
// };

// Send email when a blocked user attempts to take a quiz
const sendBlockedUserAttemptEmail = async (username) => {
    try {
        await transporter.sendMail({
            from: process.env.FROM_EMAIL,
            to: username,
            subject: 'Blocked User Quiz Attempt Notification',
            html: `
                <h1>Blocked User Quiz Attempt</h1>
                <p>Dear ${username},</p>
                <p>This is to inform you that your account has been blocked from taking quizzes.</p>
                <p>If you believe this is an error, please contact the administrator.</p>
                <p>Thank you,</p>
                <p>– The Quiz App Team</p>
            `
        });
        console.log('Blocked user quiz attempt email sent successfully');
    } catch (error) {
        console.error('Error sending blocked user quiz attempt email:', error);
    }
};

module.exports = {
    sendRegistrationEmail,
    sendQuizResultEmail,
    sendBlockedUserAttemptEmail
    // sendPasswordResetEmail
};