document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');
    
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const firstName = document.getElementById('firstName').value;
        const lastName = document.getElementById('lastName').value;
        const studentNumber = document.getElementById('studentNumber').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const department = document.getElementById('department').value;
        const year = document.getElementById('year').value;
        
        // Hide any existing messages
        errorMessage.style.display = 'none';
        successMessage.style.display = 'none';
        
        // Basic validation
        if (!firstName || !lastName || !studentNumber || !password || !confirmPassword || !department || !year) {
            errorMessage.textContent = 'Lütfen tüm alanları doldurun';
            errorMessage.style.display = 'block';
            return;
        }
        
        if (password !== confirmPassword) {
            errorMessage.textContent = 'Şifreler eşleşmiyor';
            errorMessage.style.display = 'block';
            return;
        }
        
        if (password.length < 6) {
            errorMessage.textContent = 'Şifre en az 6 karakter olmalıdır';
            errorMessage.style.display = 'block';
            return;
        }
        
        if (studentNumber.length < 8) {
            errorMessage.textContent = 'Geçerli bir öğrenci numarası giriniz';
            errorMessage.style.display = 'block';
            return;
        }
        
        try {
            const email = `${studentNumber}@firat.edu.tr`;
            
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    firstName,
                    lastName,
                    email,
                    password,
                    studentNumber,
                    department,
                    year
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                successMessage.textContent = 'Kayıt başarılı! Giriş sayfasına yönlendiriliyorsunuz...';
                successMessage.style.display = 'block';
                
                setTimeout(() => {
                    window.location.href = '/login';
                }, 2000);
            } else {
                errorMessage.textContent = result.message;
                errorMessage.style.display = 'block';
            }
        } catch (error) {
            console.error('Kayıt hatası:', error);
            errorMessage.textContent = 'Bir hata oluştu. Lütfen tekrar deneyin.';
            errorMessage.style.display = 'block';
        }
    });
}); 