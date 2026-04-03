import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const File = sequelize.define('File', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  content: {
    type: DataTypes.TEXT,
    defaultValue: '',
  },
  language: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  // THIS IS THE FIX: A unique index across name AND RoomId
  indexes: [
    {
      unique: true,
      fields: ['name', 'RoomId']
    }
  ]
});

export default File;