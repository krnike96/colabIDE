import User from './User.js';
import Room from './Room.js';
import File from './File.js';
import Participant from './Participant.js';

// 1. User <-> Room (Many-to-Many via Participant)
// Tracks everyone currently in the room
User.belongsToMany(Room, { through: Participant });
Room.belongsToMany(User, { through: Participant });

// 2. Room Ownership (One-to-Many)
// Tracks specifically who OWNS the room
User.hasMany(Room, { foreignKey: 'adminId' });
Room.belongsTo(User, { foreignKey: 'adminId', as: 'Owner' });

// 3. Room <-> File (One-to-Many)
// Tracks all files inside the room
Room.hasMany(File, {
    foreignKey: 'RoomId',
    onDelete: 'CASCADE'
});
File.belongsTo(Room, {
    foreignKey: 'RoomId'
});

// Participant explicit links for easier querying
Participant.belongsTo(User);
Participant.belongsTo(Room);

export { User, Room, File, Participant };