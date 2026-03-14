import User from '../models/User.js';

class UserRepository {
  // Logic to save a new user to the database
  async create(userData) {
    return await User.create(userData);
  }

  // Logic to find a user by email for login/registration checks
  async findByEmail(email) {
    return await User.findOne({ where: { email } });
  }

  // Logic to find a user by their unique ID
  async findById(id) {
    return await User.findByPk(id);
  }
}

export default new UserRepository();