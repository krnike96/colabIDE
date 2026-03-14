import AuthService from '../services/AuthService.js';

class AuthController {
  async register(req, res) {
    try {
      const { username, email, password } = req.body;
      const user = await AuthService.register(username, email, password);
      res.status(201).json({ message: 'User registered successfully', userId: user.id });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;
      const data = await AuthService.login(email, password);
      res.status(200).json(data);
    } catch (error) {
      res.status(401).json({ error: error.message });
    }
  }
}

export default new AuthController();