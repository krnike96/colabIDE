import sequelize from './config/db.js';
import './models/index.js'; 

const testConnection = async () => {
  try {
    console.log('Connecting to Supabase...');
    await sequelize.authenticate();
    console.log('Connection established! Syncing models...');
    
    // This creates the tables in Supabase based on your models
    await sequelize.sync({ force: true }); 
    
    console.log('Database synced successfully. All tables created.');
    process.exit(0);
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};

testConnection();