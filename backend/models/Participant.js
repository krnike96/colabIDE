import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Participant = sequelize.define('Participant', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  role: {
    type: DataTypes.ENUM('ADMIN', 'EDITOR', 'VIEWER'),
    defaultValue: 'VIEWER',
    allowNull: false
  }
});

export default Participant;