# Programming Quiz Application

A full-stack web application for taking programming quizzes with user authentication and admin dashboard.

## Features

- User Authentication (Register/Login)
- Dynamic Quiz Generation
- Multiple Programming Languages Support
- Real-time Score Tracking
- Admin Dashboard
- Quiz History
- Responsive Design

## Tech Stack

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js, Express.js
- Database: MongoDB
- Authentication: JWT

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4 or higher)
- npm or yarn package manager

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd quiz-app
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory and configure your environment variables:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/quiz_app
JWT_SECRET=your-secret-key
```

4. Start MongoDB service on your machine

5. Run the application:
```bash
node server.js
```

For development:
```bash
npm run dev
```

## Project Structure

```
├── public/
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── models/
│   ├── User.js
│   └── Quiz.js
├── routes/
│   ├── auth.js
│   ├── quiz.js
│   └── admin.js
├── server.js
├── package.json
└── .env
```

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - User login
- GET `/api/auth/profile` - Get user profile

### Quiz
- GET `/api/quiz/questions/:language` - Get quiz questions
- POST `/api/quiz/submit` - Submit quiz answers
- GET `/api/quiz/history` - Get user's quiz history

### Admin
- GET `/api/admin/results` - Get all users' results
- GET `/api/admin/questions` - Get all questions
- POST `/api/admin/questions` - Add new question
- PUT `/api/admin/questions/:id` - Update question
- DELETE `/api/admin/questions/:id` - Delete question

## Default Admin Account

```
Username: admin
Password: admin123
```

## Security Considerations

1. Change the JWT secret key in production
2. Update the admin credentials
3. Enable HTTPS in production
4. Implement rate limiting
5. Add input validation and sanitization

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License.