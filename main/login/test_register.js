const { registerUser } = require('./login_backend');

async function testRegistration() {
    const testUser = {
        name: "Test",
        surname: "User",
        email: "test@example.com",
        password: "test123",
        studentNumber: "123456789",
        department: "Computer Science",
        year: "2024"
    };

    try {
        const result = await registerUser(testUser);
        console.log("Kayıt sonucu:", result);
    } catch (error) {
        console.error("Test hatası:", error);
    }
}

// Sadece kayıt işlemini test et
testRegistration(); 