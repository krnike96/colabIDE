import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const isLocal = process.env.DB_HOST === 'localhost';

const sequelize = new Sequelize(process.env.DB_URL, {
  dialect: 'postgres',
  logging: false, 
  dialectOptions: isLocal ? {} : {
    ssl: {
      require: true,
      rejectUnauthorized: false 
    }
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 60000,
    idle: 10000
  }
});

export default sequelize;