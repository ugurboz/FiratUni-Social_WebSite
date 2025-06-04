const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../../db/models/User');
require('dotenv').config();

async function verifyEmail(req, res) {
    try {
        const { email, code } = req.body;
        console.log('Gelen doğrulama isteği:', { email, code });
        
        const tempUserData = req.session.tempUserData;
        console.log('Session verisi:', tempUserData);

        // Geçici kullanıcı verilerini kontrol et
        if (!tempUserData) {
            console.log('Session verisi bulunamadı');
            return res.status(400).json({ 
                success: false, 
                message: 'Geçersiz doğrulama işlemi - Session verisi yok' 
            });
        }

        if (tempUserData.email !== email) {
            console.log('E-posta eşleşmiyor:', { 
                sessionEmail: tempUserData.email, 
                requestEmail: email 
            });
            return res.status(400).json({ 
                success: false, 
                message: 'Geçersiz doğrulama işlemi - E-posta eşleşmiyor' 
            });
        }

        // Doğrulama kodunu kontrol et
        console.log('Kod karşılaştırması:', {
            sessionCode: tempUserData.verificationCode,
            requestCode: code
        });
        
        if (tempUserData.verificationCode !== code) {
            console.log('Geçersiz doğrulama kodu');
            return res.status(400).json({ 
                success: false, 
                message: 'Geçersiz doğrulama kodu' 
            });
        }

        // Kodun süresini kontrol et
        const now = new Date();
        const codeExpires = new Date(tempUserData.verificationCodeExpires);
        console.log('Kod süresi kontrolü:', {
            now: now.toISOString(),
            expires: codeExpires.toISOString()
        });

        if (now > codeExpires) {
            console.log('Kod süresi dolmuş');
            return res.status(400).json({ 
                success: false, 
                message: 'Doğrulama kodunun süresi dolmuş' 
            });
        }

        // Kullanıcıyı kaydet
        const userId = await User.create({
            firstName: tempUserData.firstName,
            lastName: tempUserData.lastName,
            studentNumber: tempUserData.studentNumber,
            email: tempUserData.email,
            password: tempUserData.password, // create method handles hashing
            department: tempUserData.department,
            year: tempUserData.year,
            isVerified: true
        });

        console.log('Kullanıcı başarıyla oluşturuldu. ID:', userId);

        // Geçici verileri temizle
        delete req.session.tempUserData;
        console.log('Session verisi temizlendi');

        return res.status(200).json({ 
            success: true, 
            message: 'E-posta başarıyla doğrulandı ve hesabınız oluşturuldu' 
        });
    } catch (error) {
        console.error('Doğrulama hatası:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Doğrulama sırasında bir hata oluştu: ' + error.message 
        });
    }
}

// E-posta gönderme fonksiyonu
async function sendVerificationEmail({ email, firstName, verificationCode }) {
    try {
        // E-posta gönderici ayarları
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // E-posta içeriği
        const mailOptions = {
            from: {
                name: 'beGAKKOM',
                address: process.env.EMAIL_USER
            },
            to: email,
            subject: 'beGAKKOM - E-posta Doğrulama',
            html: `
                <!DOCTYPE html>
                <html lang="tr">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>E-posta Doğrulama</title>
                    <style>
                        body {
                            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                            line-height: 1.6;
                            color: #333;
                            margin: 0;
                            padding: 0;
                            background-color: #f8f9fa;
                        }
                        .container {
                            max-width: 600px;
                            margin: 0 auto;
                            padding: 20px;
                        }
                        .email-wrapper {
                            background: #ffffff;
                            border-radius: 12px;
                            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                            overflow: hidden;
                        }
                        .header {
                            background: linear-gradient(135deg, #4361ee, #7209b7);
                            padding: 30px;
                            text-align: center;
                        }
                        .logo {
                            width: 80px;
                            height: 80px;
                            background: #ffffff;
                            border-radius: 50%;
                            display: inline-flex;
                            align-items: center;
                            justify-content: center;
                            margin-bottom: 15px;
                        }
                        .logo i {
                            font-size: 40px;
                            color: #4361ee;
                        }
                        .brand-name {
                            color: #ffffff;
                            font-size: 24px;
                            font-weight: bold;
                            margin: 0;
                        }
                        .brand-tagline {
                            color: rgba(255, 255, 255, 0.9);
                            font-size: 14px;
                            margin: 5px 0 0;
                        }
                        .content {
                            padding: 30px;
                            text-align: center;
                        }
                        .title {
                            color: #333;
                            font-size: 20px;
                            font-weight: 600;
                            margin: 0 0 20px;
                        }
                        .verification-code {
                            background: #f8f9fa;
                            border: 2px solid #e0e0e0;
                            border-radius: 8px;
                            padding: 15px;
                            margin: 20px 0;
                            font-size: 24px;
                            font-weight: bold;
                            color: #4361ee;
                            letter-spacing: 5px;
                        }
                        .message {
                            color: #666;
                            font-size: 16px;
                            margin: 20px 0;
                        }
                        .warning {
                            color: #dc2626;
                            font-size: 14px;
                            margin: 20px 0;
                        }
                        .footer {
                            background: #f8f9fa;
                            padding: 20px;
                            text-align: center;
                            font-size: 12px;
                            color: #666;
                            border-top: 1px solid #e0e0e0;
                        }
                        .button {
                            display: inline-block;
                            background: #4361ee;
                            color: #ffffff;
                            text-decoration: none;
                            padding: 12px 30px;
                            border-radius: 6px;
                            font-weight: 600;
                            margin: 20px 0;
                        }
                        .button:hover {
                            background: #3a56d4;
                        }
                        @media only screen and (max-width: 600px) {
                            .container {
                                padding: 10px;
                            }
                            .content {
                                padding: 20px;
                            }
                            .verification-code {
                                font-size: 20px;
                            }
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="email-wrapper">
                            <div class="header">
                                <div class="logo">
                                    <i class="fas fa-users"></i>
                                </div>
                                <h1 class="brand-name">beGAKKOM</h1>
                                <p class="brand-tagline">Fırat Üniversitesi Sosyal Platformu</p>
                            </div>
                            <div class="content">
                                <h2 class="title">E-posta Adresinizi Doğrulayın</h2>
                                <p class="message">
                                    Merhaba ${firstName},<br>
                                    beGAKKOM'a hoş geldiniz! Hesabınızı aktifleştirmek için aşağıdaki doğrulama kodunu kullanın.
                                </p>
                                <div class="verification-code">
                                    ${verificationCode}
                                </div>
                                <p class="message">
                                    Bu kod 1 dakika içinde geçerliliğini yitirecektir. Eğer bu işlemi siz yapmadıysanız, lütfen bu e-postayı dikkate almayın.
                                </p>
                                <p class="warning">
                                    ⚠️ Güvenliğiniz için bu kodu kimseyle paylaşmayın.
                                </p>
                            </div>
                            <div class="footer">
                                <p>© 2024 beGAKKOM - Tüm hakları saklıdır.</p>
                                <p>Bu e-posta otomatik olarak gönderilmiştir, lütfen yanıtlamayınız.</p>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        // E-postayı gönder
        await transporter.sendMail(mailOptions);
        console.log('Doğrulama kodu gönderildi:', { email, code: verificationCode });
        return true;
    } catch (error) {
        console.error('E-posta gönderme hatası:', error);
        throw error;
    }
}

module.exports = {
    verifyEmail,
    sendVerificationEmail
};
