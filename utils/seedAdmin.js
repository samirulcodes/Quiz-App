const User = require('../models/User');

async function seedAdmin() {
    try {
        // Check if admin already exists
        const adminExists = await User.findOne({ username: 'admin' });
        
        if (!adminExists) {
            // Create admin user
            const admin = new User({
                username: 'admin',
                password: 'admin123',
                role: 'admin'
            });
            
            await admin.save();
            console.log('Admin user created successfully');
        } else {
            console.log('Admin user already exists');
        }
    } catch (error) {
        console.error('Error creating admin user:', error);
    }
}

module.exports = seedAdmin;