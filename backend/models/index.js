import User from './User.js';
import Room from './Room.js';
import File from './File.js';
import Participant from './Participant.js';

// User <-> Room (Many-to-Many via Participant)
User.belongsToMany(Room, { through: Participant });
Room.belongsToMany(User, { through: Participant });

// Participant explicit links (helpful for querying roles later)
Participant.belongsTo(User);
Participant.belongsTo(Room);

// Room <-> File (One-to-Many)
Room.hasMany(File, { onDelete: 'CASCADE' });
File.belongsTo(Room);

export { User, Room, File, Participant };