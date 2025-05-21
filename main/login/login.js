console.log('Login script loaded'); // Debug log

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded'); // Debug log
    
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) {
        console.error('Login form not found!'); // Debug log
        return;
    }
    
    console.log('Login form found'); // Debug log
    
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('Form submitted'); // Debug log
        
        const studentNumber = document.getElementById('studentNumber').value;
        const password = document.getElementById('password').value;
        const errorMessage = document.getElementById('errorMessage');
        const successMessage = document.getElementById('successMessage');
        const loginButton = document.querySelector('.login-button');
        
        console.log('Form values:', { studentNumber, password }); // Debug log
        
        // Hide any existing messages
        errorMessage.style.display = 'none';
        successMessage.style.display = 'none';
        
        // Basic validation
        if (!studentNumber || !password) {
            console.log('Validation failed: empty fields'); // Debug log
            errorMessage.textContent = 'Lütfen tüm alanları doldurun';
            errorMessage.style.display = 'block';
            return;
        }
        
        // Add loading state
        loginButton.classList.add('loading');
        loginButton.disabled = true;
        
        try {
            // Convert student number to email
            const email = `${studentNumber}@firat.edu.tr`;
            console.log('Attempting login with email:', email); // Debug log
            
            // Use fetch API to call the backend
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });
            
            const result = await response.json();
            console.log('Login result:', result); // Debug log
            
            if (result.success) {
                if (result.needsVerification) {
                    // E-posta doğrulama gerekiyor
                    localStorage.setItem('userEmail', email);
                    window.location.href = 'verify_email_screen.html';
                } else {
                    // Normal giriş
                    localStorage.setItem('authToken', result.authToken);
                    localStorage.setItem('user', JSON.stringify(result.user));
                    localStorage.setItem('userEmail', result.user.email);
                    
                    // Tema desteği için userData'yı ekle 
                    localStorage.setItem('userData', JSON.stringify({
                        email: result.user.email,
                        displayName: `${result.user.firstName || ''} ${result.user.lastName || ''}`.trim(),
                        theme: result.user.theme || 'light'
                    }));
                    
                    // Kullanıcının tercih ettiği temayı hemen uygula
                    const userTheme = result.user.theme || 'light';
                    document.documentElement.setAttribute('data-theme', userTheme);
                    localStorage.setItem('theme', userTheme);
                    
                    // Show success message
                    successMessage.textContent = 'Giriş başarılı! Yönlendiriliyorsunuz...';
                    successMessage.style.display = 'block';
                    
                    // Ana sayfaya yönlendir
                    setTimeout(() => {
                        window.location.href = '../anasayfa/anasayfa_screen.html';
                    }, 2000);
                }
            } else {
                // Show error message
                errorMessage.textContent = result.message;
                errorMessage.style.display = 'block';
            }
        } catch (error) {
            console.error('Login error:', error);
            errorMessage.textContent = 'Bir hata oluştu';
            errorMessage.style.display = 'block';
        } finally {
            // Remove loading state
            loginButton.classList.remove('loading');
            loginButton.disabled = false;
        }
    });
}); 