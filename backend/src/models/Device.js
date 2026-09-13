const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, index: true },
  deviceName: { type: String, required: true, trim: true },
  deviceType: { 
    type: String, 
    enum: ['laptop', 'desktop', 'server', 'router', 'switch', 'printer', 'other'],
    required: true 
  },
  serialNumber: { type: String, required: true, unique: true },
  status: { type: String, enum: ['active', 'maintenance', 'retired'], default: 'active' },
  ipAddress: String,
  location: String,
  assignedTo: String,
  specs: {
    cpu: String,
    ram: String,
    storage: String
  }
}, { timestamps: true });

module.exports = mongoose.model('Device', deviceSchema);