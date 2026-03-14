import AuthService from './services/AuthService.js';
import sequelize from './config/db.js';

async function test() {
  try {
    console.log("Testing Registration...");
    const user = await AuthService.register("dev_tester", "test@colab.com", "Password123");
    console.log("User Created:", user.username);

    console.log("Testing Login...");
    const session = await AuthService.login("test@colab.com", "Password123");
    console.log("Login Success! Token generated.");
    process.exit(0);
  } catch (e) {
    console.error("Test Failed:", e.message);
    process.exit(1);
  }
}
test();