const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        validate: {
            validator: function(v) {
                return /^[a-zA-Z0-9._%+-]+@firat\.edu\.tr$/.test(v);
            },
            message: props => `${props.value} geçerli bir Fırat Üniversitesi e-posta adresi değil!`
        }
    },
    studentNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    department: {
        type: String,
        required: true,
        enum: [
            'Bilgisayar Mühendisliği',
            'Elektrik-Elektronik Mühendisliği',
            'Endüstri Mühendisliği',
            'İnşaat Mühendisliği',
            'Makine Mühendisliği',
            'Mekatronik Mühendisliği',
            'Metalurji ve Malzeme Mühendisliği',
            'Yazılım Mühendisliği',
            'Biyomedikal Mühendisliği',
            'Çevre Mühendisliği',
            'Enerji Sistemleri Mühendisliği',
            'Gıda Mühendisliği',
            'Harita Mühendisliği',
            'Jeoloji Mühendisliği',
            'Kimya Mühendisliği',
            'Maden Mühendisliği',
            'Petrol ve Doğalgaz Mühendisliği',
            'Tekstil Mühendisliği'
        ]
    },
    year: {
        type: Number,
        required: true,
        min: 1,
        max: 4
    },
    bio: {
        type: String,
        default: ''
    },
    interests: {
        type: String,
        default: ''
    },
    profilePicture: {
        type: String,
        default: ''
    },
    privacy: {
        profileVisibility: {
            type: String,
            enum: ['public', 'friends', 'private'],
            default: 'public'
        },
        postVisibility: {
            type: String,
            enum: ['public', 'friends', 'private'],
            default: 'public'
        },
        eventVisibility: {
            type: String,
            enum: ['public', 'friends', 'private'],
            default: 'public'
        },
        clubVisibility: {
            type: String,
            enum: ['public', 'friends', 'private'],
            default: 'public'
        }
    },
    notifications: {
        email: {
            type: Boolean,
            default: true
        },
        messages: {
            type: Boolean,
            default: true
        },
        events: {
            type: Boolean,
            default: true
        },
        clubs: {
            type: Boolean,
            default: true
        },
        interactions: {
            type: Boolean,
            default: true
        }
    },
    emailVerified: {
        type: Boolean,
        default: false
    },
    verificationCode: {
        type: String,
        default: null
    },
    verificationCodeExpiry: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Şifre hashleme middleware
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Şifre karşılaştırma metodu
userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema); 