document.addEventListener('DOMContentLoaded', function() {
    const resetPasswordForm = document.getElementById('resetPasswordForm');
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');

    // URL'den token'ı al
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (!token) {
        showError('Geçersiz veya eksik token. Lütfen şifre sıfırlama bağlantısını tekrar kullanın.');
        return;
    }

    resetPasswordForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Şifre kontrolü
        const passwordValidation = validatePassword(newPassword);
        if (!passwordValidation.valid) {
            showError(passwordValidation.message);
            return;
        }

        if (newPassword !== confirmPassword) {
            showError('Şifreler eşleşmiyor.');
            return;
        }

        try {
            const response = await fetch('/api/reset-password-with-token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token: token,
                    newPassword: newPassword
                })
            });

            const data = await response.json();
            if (data.success) {
                // Başarılı sıfırlama
                successMessage.textContent = 'Şifreniz başarıyla değiştirildi! Giriş sayfasına yönlendiriliyorsunuz...';
                successMessage.style.display = 'block';
                errorMessage.style.display = 'none';

                // 3 saniye sonra giriş sayfasına yönlendir
                setTimeout(() => {
                    window.location.href = '../login/login_screen.html';
                }, 3000);
            } else {
                // Hata durumu
                showError(data.message || 'Bir hata oluştu. Lütfen tekrar deneyin.');
            }
        } catch (error) {
            showError('Bağlantı hatası. Lütfen internet bağlantınızı kontrol edin ve tekrar deneyin.');
        }
    });

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        successMessage.style.display = 'none';
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