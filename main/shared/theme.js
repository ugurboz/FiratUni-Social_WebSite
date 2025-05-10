/**
 * Tema Yönetimi
 * Bu dosya, site genelinde tema ayarlarını yönetmek için kullanılır.
 */

// Tema değişikliklerini izleme için MutationObserver
let themeObserver;

// Sayfanın yüklenmesinden sonra tema ayarlarını kontrol eder
document.addEventListener('DOMContentLoaded', function() {
    // İlk yüklendiğinde temayı hemen uygula
    loadUserTheme();
    
    // Tema izleyicisini başlat
    startThemeObserver();
    
    // Sayfa tamamen yüklendiğinde tema uygulama durumunu kontrol et (CSS yüklenmesi gibi)
    window.addEventListener('load', function() {
        // Tema güncellemelerini uygula ve UI elemanlarını güncelle
        loadUserTheme();
        updateThemeUI();
        applyThemeToAllElements();
        
        // 500ms sonra tekrar kontrol et (CSS'in tam yüklenmesi için)
        setTimeout(() => {
            loadUserTheme();
            updateThemeUI();
            applyThemeToAllElements();
        }, 500);
    });
});

// Tema attribute değişikliklerini izle
function startThemeObserver() {
    // Daha önce varsa temizle
    if (themeObserver) {
        themeObserver.disconnect();
    }
    
    // HTML element üzerindeki data-theme değişikliklerini izle
    themeObserver = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.attributeName === 'data-theme') {
                // Tema CSS'lerinin tam olarak uygulanması için tüm tema değişkenlerini yenile
                const currentTheme = document.documentElement.getAttribute('data-theme');
                console.log('Tema değişimi algılandı:', currentTheme);
                applyThemeToAllElements();
                
                // Tema değişikliğini tüm iframe'lere de uygula
                applyThemeToIframes(currentTheme);
            }
        });
    });
    
    // Gözlemi başlat
    themeObserver.observe(document.documentElement, { attributes: true });
}

// iFrame'lere tema değişikliğini uygula
function applyThemeToIframes(theme) {
    if (window.frames && window.frames.length > 0) {
        for (let i = 0; i < window.frames.length; i++) {
            try {
                window.frames[i].document.documentElement.setAttribute('data-theme', theme);
            } catch (e) {
                console.warn('Farklı kaynaktaki iframe güncellenemedi:', e);
            }
        }
    }
}

// Tüm elemanlara tema CSS değişkenlerini uygula
function applyThemeToAllElements() {
    // Tema değişkenlerini body'ye ve diğer bileşenlere uygula
    const currentTheme = document.documentElement.getAttribute('data-theme');
    
    // Temel bileşenler
    const elements = document.querySelectorAll('.navbar, .post, .sidebar, .post-card, .feed-section, .sidebar-card, .live-events, .chat-section, .message-received, .message-sent, .comment-section, .notification, .users-list, .user-item, .chat-messages');
    
    // Form elemanları
    const formElements = document.querySelectorAll('input, textarea, select, button, .upload-btn, .post-button, .send-btn');
    
    // Temel elementlere tema değişkenlerini uygula
    elements.forEach(el => {
        if (el) {
            // Kısa bir geçiş efekti için stili yeniden uygula
            el.style.transition = 'none';
            el.offsetHeight; // reflow
            el.style.transition = 'background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease';
            
            // Tema CSS değişkenlerinin uygulanmasını zorla
            if (el.classList.contains('navbar')) {
                el.style.background = 'var(--navbar-bg)';
                el.style.color = 'var(--navbar-text)';
            } else {
                el.style.backgroundColor = '';
                el.style.color = '';
                
                // Yeniden uygula
                el.style.backgroundColor = getComputedStyle(el).backgroundColor;
                el.style.color = getComputedStyle(el).color;
            }
        }
    });
    
    // Form elemanlarına tema uygula
    formElements.forEach(el => {
        if (el) {
            el.style.transition = 'none';
            el.offsetHeight; // reflow
            el.style.transition = 'background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease';
            
            // Elemana göre farklı stil uygula
            if (el.tagName.toLowerCase() === 'input' || el.tagName.toLowerCase() === 'textarea') {
                el.style.backgroundColor = 'var(--input-background)';
                el.style.color = 'var(--input-text)';
                el.style.borderColor = 'var(--input-border)';
            } else if (el.tagName.toLowerCase() === 'button' || el.classList.contains('upload-btn') || el.classList.contains('post-button')) {
                el.style.color = '';
                el.style.backgroundColor = '';
            }
        }
    });
}

// Storage olaylarını dinle (farklı sekmelerde tema değişikliği olduğunda tetiklenir)
window.addEventListener('storage', function(event) {
    if (event.key === 'theme' || event.key === 'theme_change_timestamp' || event.key === 'userData') {
        console.log('Tema değişikliği algılandı, tema yenileniyor...');
        loadUserTheme();
        updateThemeUI(); // Arayüz elemanlarını güncelle
        applyThemeToAllElements(); // Tüm elemanlara uygula
    }
});

// Karanlık tema tespiti ve ayarları (sistem tercihi)
function detectPreferredColorScheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
    }
    return 'light';
}

// Kullanıcı tema tercihini yükle ve uygula
function loadUserTheme() {
    // Oturum kontrolü
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const userTheme = userData.theme;
    
    // localStorage'dan tema ayarını al (userData'dan veya doğrudan theme'den)
    const savedTheme = userTheme || localStorage.getItem('theme') || detectPreferredColorScheme();
    
    // Temayı uygula
    document.documentElement.setAttribute('data-theme', savedTheme);
    localStorage.setItem('theme', savedTheme);
    
    console.log('Tema uygulandı:', savedTheme);
    
    // Tema değişikliğini iframe'lere de uygula
    applyThemeToIframes(savedTheme);
}

// Temayı doğrudan uygula (localStorage'dan okuyarak)
function applyTheme() {
    const currentTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    applyThemeToAllElements(); // Tüm elemanlara uygula
    applyThemeToIframes(currentTheme);
}

// Temayı değiştir (yalnızca lokal değişiklik, kaydetmez)
function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    applyThemeToAllElements(); // Tüm elemanlara uygula
    applyThemeToIframes(theme);
}

// Temayı değiştir ve sunucuya kaydet
function changeAndSaveTheme(theme, onSuccess = null) {
    // Temayı değiştir
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    // Temayı tüm açık sekmelere iletmek için storage olayını kullan
    try {
        // Özel bir mesaj ile temayı diğer sekmelere ilet
        localStorage.setItem('theme_change_timestamp', Date.now().toString());
        
        // Çerezle de ilet (çapraz sekme iletişimi için)
        document.cookie = `theme=${theme}; path=/; max-age=31536000`; // 1 yıl geçerli
    } catch (e) {
        console.error('Tema değişikliği diğer sekmelere iletilemedi:', e);
    }
    
    // Tüm elemanlara uygula
    applyThemeToAllElements();
    
    // Iframe'lere uygula
    applyThemeToIframes(theme);
    
    // Kullanıcı oturumu varsa sunucuya kaydet
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    if (userData.email) {
        // Temayı veritabanına kaydet
        saveThemePreference(userData.email, theme)
            .then(() => {
                // Kullanıcı bilgilerini güncelle
                userData.theme = theme;
                localStorage.setItem('userData', JSON.stringify(userData));
                
                // Başarı geri çağırımı varsa çalıştır
                if (typeof onSuccess === 'function') {
                    onSuccess(theme);
                }
            });
    } else if (typeof onSuccess === 'function') {
        onSuccess(theme);
    }
}

// Tema tercihini sunucuya kaydet
async function saveThemePreference(email, theme) {
    try {
        const response = await fetch('/api/user/theme', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({ email, theme })
        });
        
        const result = await response.json();
        
        if (!result.success) {
            console.error('Tema tercihi kaydedilemedi:', result.message);
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Tema tercihi kaydedilirken hata oluştu:', error);
        return false;
    }
}

// Tema değişimi sonrası UI elemanlarını güncelle
function updateThemeUI() {
    // Tema toggle butonlarını güncelle (eğer sayfada varsa)
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        const currentTheme = localStorage.getItem('theme');
        darkModeToggle.checked = currentTheme === 'dark';
    }
    
    // Gece modu değişikliğini sayfa içerisindeki diğer bileşenlere bildir (özel event)
    const themeChangeEvent = new CustomEvent('themeChange', { 
        detail: { theme: localStorage.getItem('theme') } 
    });
    document.dispatchEvent(themeChangeEvent);
    
    // Ana CSS değişkenlerini yeniden yükle (bazı tarayıcı uyumluluğu için)
    const currentTheme = document.documentElement.getAttribute('data-theme');
    document.documentElement.setAttribute('data-theme', '');
    setTimeout(() => {
        document.documentElement.setAttribute('data-theme', currentTheme);
    }, 10);
} 