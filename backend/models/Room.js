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
  adminId: {
    type: DataTypes.UUID,
    allowNull: false,
  }
});

export default Room;