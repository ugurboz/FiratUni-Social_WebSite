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
        
        // Şifre gücü kontrolü
        const passwordValidation = validatePassword(formData.password);
        if (!passwordValidation.valid) {
            showError(passwordValidation.message);
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
                // Başarılı kayıt
                errorMessage.style.display = 'none';
                alert(result.message);
                window.location.href = '/main/login/login_screen.html';
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
        setTimeout(() => {
            errorMessage.style.animation = 'shake 0.5s ease';
        }, 10);
        setTimeout(() => {
            errorMessage.style.animation = '';
        }, 510);
    }
    
    // Şifre validasyon fonksiyonu
    function validatePassword(password) {
        if (password.length < 8) {
            return { valid: false, message: 'Şifre en az 8 karakter uzunluğunda olmalıdır.' };
        }
        
        if (!/[A-Z]/.test(password)) {
            return { valid: false, message: 'Şifre en az bir büyük harf içermelidir.' };
        }
        
        if (!/[a-z]/.test(password)) {
            return { valid: false, message: 'Şifre en az bir küçük harf içermelidir.' };
        }
        
        if (!/[0-9]/.test(password)) {
            return { valid: false, message: 'Şifre en az bir rakam içermelidir.' };
        }
        
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
            return { valid: false, message: 'Şifre en az bir özel karakter içermelidir (!, @, #, $ vb.).' };
        }
        
        return { valid: true };
    }
}); 