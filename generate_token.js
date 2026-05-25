const jwt = require('jsonwebtoken');
require('dotenv').config();

const token = jwt.sign(
  {
    sub: '123456789',
    telegramId: '123456789',
    firstName: 'TestUser',
    role: 'customer',
  },
  process.env.JWT_SECRET,
  { expiresIn: '90d' }
);
console.log(token);
