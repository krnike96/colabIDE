import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import UserRepository from '../repositories/UserRepository.js';
import dotenv from 'dotenv';

dotenv.config();

class AuthService {
  async register(username, email, password) {
    // 1. Check if user already exists [cite: 7]
    const existingUser = await UserRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    // 2. Hash the password - Single Responsibility: Security [cite: 7]
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Save via Repository [cite: 11]
    return await UserRepository.create({
      username,
      email,
      password: hashedPassword
    });
  }

  async login(email, password) {
    const user = await UserRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Compare hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    // Generate JWT [cite: 6]
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET || 'dev_secret_key',
      { expiresIn: '24h' }
    );

    return { 
      user: { id: user.id, username: user.username, email: user.email }, 
      token 
    };
  }
}

export default new AuthService();