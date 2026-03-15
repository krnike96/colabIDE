import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Room = sequelize.define('Room', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  htmlContent: {
    type: DataTypes.TEXT,
    defaultValue: '<h1>Hello World</h1>'
  },
  cssContent: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  jsContent: {
    type: DataTypes.TEXT,
    defaultValue: ''
  }
});

export default Room;