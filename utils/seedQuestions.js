const Quiz = require('../models/Quiz');

const sampleQuestions = [
    {
        language: 'javascript',
        question: 'What is the output of: console.log(typeof typeof 1)?',
        options: ['number', 'string', 'undefined', 'object'],
        correctAnswer: 1,
        difficulty: 'medium',
        explanation: 'typeof 1 returns "number", and typeof "number" returns "string"'
    },
    {
        language: 'javascript',
        question: 'Which method removes the last element from an array and returns it?',
        options: ['pop()', 'push()', 'shift()', 'unshift()'],
        correctAnswer: 0,
        difficulty: 'easy',
        explanation: 'The pop() method removes the last element from an array and returns that element.'
    },
    {
        language: 'python',
        question: 'What is the output of: print(type(type(1)))?',
        options: ['<class \'int\'>', '<class \'type\'>', '<class \'object\'>', 'TypeError'],
        correctAnswer: 1,
        difficulty: 'medium',
        explanation: 'type(1) returns <class \'int\'>, and type(<class \'int\'>) returns <class \'type\'>'
    },
    {
        language: 'python',
        question: 'Which method is used to add an element at the end of a list?',
        options: ['append()', 'extend()', 'insert()', 'add()'],
        correctAnswer: 0,
        difficulty: 'easy',
        explanation: 'The append() method adds a single element at the end of a list.'
    },
    {
        language: 'java',
        question: 'What is the output of: System.out.println("Hello" + 1 + 2);',
        options: ['Hello12', 'Hello3', '3Hello', 'Compilation Error'],
        correctAnswer: 0,
        difficulty: 'easy',
        explanation: 'String concatenation happens from left to right.'
    },
    {
        language: 'java',
        question: 'Which of these keywords is used to define a constant in Java?',
        options: ['const', 'final', 'static', 'constant'],
        correctAnswer: 1,
        difficulty: 'easy',
        explanation: 'The final keyword is used to define constants in Java.'
    },
    {
        language: 'javascript',
        question: 'What is the result of [1, 2, 3].map(num => num * 2)?',
        options: ['[1, 2, 3]', '[2, 4, 6]', '[1, 4, 9]', '[undefined, undefined, undefined]'],
        correctAnswer: 1,
        difficulty: 'medium',
        explanation: 'map() creates a new array with the results of calling the provided function on every element.'
    },
    {
        language: 'python',
        question: 'What is the output of: [x*2 for x in range(3)]?',
        options: ['[0, 2, 4]', '[1, 2, 3]', '[2, 4, 6]', '[0, 1, 2]'],
        correctAnswer: 0,
        difficulty: 'medium',
        explanation: 'List comprehension with range(3) generates [0, 1, 2], then each number is multiplied by 2.'
    },
    {
        language: 'java',
        question: 'What is the size of int data type in Java?',
        options: ['16 bit', '32 bit', '64 bit', '8 bit'],
        correctAnswer: 1,
        difficulty: 'medium',
        explanation: 'In Java, int is a 32-bit signed integer data type.'
    },
    {
        language: 'javascript',
        question: 'What is the output of: Boolean([])?',
        options: ['false', 'true', 'undefined', 'null'],
        correctAnswer: 1,
        difficulty: 'medium',
        explanation: 'An empty array is a truthy value in JavaScript.'
    }
];

async function seedQuestions() {
    try {
        // Clear existing questions
        await Quiz.deleteMany({});
        
        // Insert sample questions
        await Quiz.insertMany(sampleQuestions);
        
        console.log('Sample questions seeded successfully');
    } catch (error) {
        console.error('Error seeding questions:', error);
    }
}

module.exports = seedQuestions;