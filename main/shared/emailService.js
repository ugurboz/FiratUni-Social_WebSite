const nodemailer = require('nodemailer');
require('dotenv').config();

// SMTP transport konfigürasyonu
const transporter = nodemailer.createTransport({
  service: 'gmail', // Gmail, Outlook, Yahoo, vb. hizmetleri kullanabilirsiniz
  auth: {
    user: process.env.EMAIL_USER || 'your_email@gmail.com', // .env dosyasına ekleyin veya doğrudan güncelleyin
    pass: process.env.EMAIL_PASS || 'your_app_password' // Gmail için uygulama şifresi kullanmalısınız
  }
});

/**
 * E-posta gönderme fonksiyonu
 * @param {string} to - Alıcı e-posta adresi
 * @param {string} subject - E-posta konusu
 * @param {string} text - Düz metin içerik (HTML içerik yoksa bu kullanılır)
 * @param {string} html - HTML içerik (opsiyonel)
 * @returns {Promise} - İşlem sonucu
 */
const sendEmail = async (to, subject, text, html) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || 'your_email@gmail.com',
      to,
      subject,
      text,
      html: html || text
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('E-posta gönderildi:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('E-posta gönderilirken hata oluştu:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Şifre sıfırlama e-postası gönderme
 * @param {string} to - Alıcı e-posta adresi
 * @param {string} resetLink - Şifre sıfırlama bağlantısı
 * @returns {Promise} - İşlem sonucu
 */
const sendPasswordResetEmail = async (to, resetLink) => {
  const subject = 'beGAKKOM - Şifre Sıfırlama İsteği';
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 10px;">
      <h2 style="color: #4361ee; text-align: center;">Şifre Sıfırlama İsteği</h2>
      <p>Merhaba,</p>
      <p>Fırat Üniversitesi beGAKKOM platformunda şifrenizi sıfırlamak için bir istek aldık. Şifrenizi sıfırlamak için aşağıdaki bağlantıya tıklayabilirsiniz:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetLink}" style="background-color: #4361ee; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Şifremi Sıfırla</a>
      </div>
      <p>Eğer bu isteği siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.</p>
      <p>İyi günler,<br>beGAKKOM Ekibi</p>
    </div>
  `;

  return sendEmail(to, subject, 'Şifre sıfırlama isteğiniz için bağlantı: ' + resetLink, html);
};

/**
 * Hoş geldiniz e-postası gönderme
 * @param {string} to - Alıcı e-posta adresi
 * @param {string} firstName - Kullanıcının adı
 * @returns {Promise} - İşlem sonucu
 */
const sendWelcomeEmail = async (to, firstName) => {
  const subject = 'beGAKKOM - Hoş Geldiniz!';
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 10px;">
      <h2 style="color: #4361ee; text-align: center;">Fırat Üniversitesi Sosyal Platformuna Hoş Geldiniz!</h2>
      <p>Merhaba ${firstName},</p>
      <p>beGAKKOM'a üye olduğunuz için teşekkür ederiz. Artık platform üzerinde etkinliklere katılabilir, kulüplere üye olabilir ve diğer öğrencilerle iletişim kurabilirsiniz.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://begakkom.onrender.com/anasayfa/anasayfa_screen.html" style="background-color: #4361ee; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Hemen Başla</a>
      </div>
      <p>Herhangi bir sorunuz olursa, bizimle iletişime geçmekten çekinmeyin.</p>
      <p>İyi günler,<br>beGAKKOM Ekibi</p>
    </div>
  `;

  return sendEmail(to, subject, `Merhaba ${firstName}, beGAKKOM'a hoş geldiniz!`, html);
};

/**
 * Etkinlik hatırlatma e-postası gönderme
 * @param {string} to - Alıcı e-posta adresi
 * @param {string} eventName - Etkinlik adı
 * @param {string} eventDate - Etkinlik tarihi
 * @param {string} eventLocation - Etkinlik yeri
 * @returns {Promise} - İşlem sonucu
 */
const sendEventReminderEmail = async (to, eventName, eventDate, eventLocation) => {
  const subject = `beGAKKOM - ${eventName} Etkinlik Hatırlatması`;
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 10px;">
      <h2 style="color: #4361ee; text-align: center;">Etkinlik Hatırlatması</h2>
      <p>Merhaba,</p>
      <p>Katılacağınız <strong>${eventName}</strong> etkinliği yaklaşıyor! Etkinlik detayları:</p>
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Tarih:</strong> ${eventDate}</p>
        <p><strong>Yer:</strong> ${eventLocation}</p>
      </div>
      <p>Etkinliğe katılımınız için teşekkür ederiz.</p>
      <p>İyi günler,<br>beGAKKOM Ekibi</p>
    </div>
  `;

  return sendEmail(to, subject, `${eventName} etkinliği hatırlatması: ${eventDate}, ${eventLocation}`, html);
};

/**
 * E-posta doğrulama kodu gönderme
 * @param {string} to - Alıcı e-posta adresi
 * @param {string} verificationCode - Doğrulama kodu
 * @returns {Promise} - İşlem sonucu
 */
const sendVerificationEmail = async (to, verificationCode) => {
  const subject = 'beGAKKOM - E-posta Doğrulama';
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 10px;">
      <h2 style="color: #4361ee; text-align: center;">E-posta Doğrulama</h2>
      <p>Merhaba,</p>
      <p>beGAKKOM hesabınızı doğrulamak için aşağıdaki kodu kullanın:</p>
      <div style="text-align: center; margin: 30px 0;">
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; font-size: 24px; font-weight: bold; letter-spacing: 5px;">
          ${verificationCode}
        </div>
      </div>
      <p>Bu kod 10 dakika süreyle geçerlidir.</p>
      <p>İyi günler,<br>beGAKKOM Ekibi</p>
    </div>
  `;

  return sendEmail(to, subject, `Doğrulama kodunuz: ${verificationCode}`, html);
};

module.exports = {
  sendEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendEventReminderEmail,
  sendVerificationEmail
}; 