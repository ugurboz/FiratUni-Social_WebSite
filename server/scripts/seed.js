const seedUsers = async () => {
    try {
        await User.deleteMany({});
        
        const users = [
            {
                firstName: 'Test',
                lastName: 'User',
                email: 'test@example.com',
                password: 'password123',
                studentNumber: '2023001',
                department: 'Computer Engineering',
                semester: 3,
                bio: 'Test user account',
                interests: ['Programming', 'Web Development']
            }
        ];
        
        await User.insertMany(users);
        console.log('Users seeded successfully');
    } catch (error) {
        console.error('Error seeding users:', error);
    }
}; 