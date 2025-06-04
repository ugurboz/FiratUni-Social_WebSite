document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');
    const errorMessage = document.createElement('div');
    errorMessage.className = 'error-message';
    registerForm.appendChild(errorMessage);

    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Form verilerini al
        const formData = {
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            studentNumber: document.getElementById('studentNumber').value,
            password: document.getElementById('password').value,
            department: document.getElementById('department').value,
            year: document.getElementById('year').value
        };

        // Şifre kontrolü
        const confirmPassword = document.getElementById('confirmPassword').value;
        if (formData.password !== confirmPassword) {
            showError('Şifreler eşleşmiyor');
            return;
        }

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (result.success) {
                // Store email for verification
                const userEmail = formData.studentNumber + '@firat.edu.tr';
                localStorage.setItem('userEmail', userEmail);
                console.log('Stored email:', userEmail); // Debug log
                // Redirect to verification page
                window.location.href = '/main/verify/verify_email_screen.html';
            } else {
                // Hata durumu
                showError(result.message);
            }
        } catch (error) {
            console.error('Kayıt hatası:', error);
            showError('Bir hata oluştu. Lütfen tekrar deneyin.');
        }
    });

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
    }
}); 