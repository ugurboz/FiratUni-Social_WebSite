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
        if (newPassword.length < 6) {
            showError('Şifre en az 6 karakter uzunluğunda olmalıdır.');
            return;
        }

        if (newPassword !== confirmPassword) {
            showError('Şifreler eşleşmiyor.');
            return;
        }

        try {
            const response = await fetch('https://begakkom.onrender.com/api/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    token: token,
                    newPassword: newPassword
                })
            });

            const data = await response.json();

            if (data.success) {
                showSuccess('Şifreniz başarıyla güncellendi. Giriş sayfasına yönlendiriliyorsunuz...');
                setTimeout(() => {
                    window.location.href = '/main/login/login_screen.html';
                }, 2000);
            } else {
                showError(data.message || 'Şifre güncellenirken bir hata oluştu.');
            }
        } catch (error) {
            console.error('Şifre sıfırlama hatası:', error);
            showError('Bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
        }
    });

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        successMessage.style.display = 'none';
    }

    function showSuccess(message) {
        successMessage.textContent = message;
        successMessage.style.display = 'block';
        errorMessage.style.display = 'none';
    }
}); 