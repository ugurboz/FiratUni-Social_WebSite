const jwt = require("jsonwebtoken");
const bcrypt = require('bcrypt');

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ msg: "Yetkisiz erişim." });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'begakkom-secret-key-2024');
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ msg: "Token geçersiz." });
  }
};

const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

const verifyPassword = async (password, hashed) => {
  return await bcrypt.compare(password, hashed);
};

module.exports = { authenticate, hashPassword, verifyPassword }; 