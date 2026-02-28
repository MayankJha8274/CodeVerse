const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Room name is required'],
    trim: true,
    maxlength: [100, 'Room name cannot exceed 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters'],
    default: ''
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  inviteCode: {
    type: String,
    unique: true,
    default: generateInviteCode
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'member'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  settings: {
    isPrivate: {
      type: Boolean,
      default: true
    },
    maxMembers: {
      type: Number,
      default: 100
    },
    allowMemberInvite: {
      type: Boolean,
      default: false
    }
  },
  stats: {
    totalMembers: {
      type: Number,
      default: 1
    },
    activeMembers: {
      type: Number,
      default: 1
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Generate unique invite code before saving
roomSchema.pre('save', function() {
  if (!this.inviteCode) {
    this.inviteCode = generateInviteCode();
  }
});

// Helper function to generate invite code (declared before schema for default usage)
function generateInviteCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Method to check if user is owner or admin
roomSchema.methods.isUserAdmin = function(userId) {
  const member = this.members.find(m => m.user.toString() === userId.toString());
  return member && (member.role === 'owner' || member.role === 'admin');
};

// Method to check if user is member
roomSchema.methods.isUserMember = function(userId) {
  return this.members.some(m => m.user.toString() === userId.toString());
};

module.exports = mongoose.model('Room', roomSchema);
