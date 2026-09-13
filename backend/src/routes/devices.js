const express = require('express');
const router = express.Router();
const Device = require('../models/Device');
const { getAuth } = require('@clerk/express');

// ---------------------------------------------------------------------------
// Helper: pull tenantId out of the Clerk session and reject if missing.
// Every route calls this first. If no organization is active, the request
// is stopped with a clear 400 — no query is ever run without a tenant.
// ---------------------------------------------------------------------------
function getTenantId(req, res) {
  const { orgId } = getAuth(req);
  if (!orgId) {
    res.status(400).json({
      success: false,
      error: 'No active organization. Please create or select an organization.',
    });
    return null;
  }
  return orgId;
}

// ---------------------------------------------------------------------------
// Apply authentication to every route in this file.
// We use getAuth() instead of the deprecated requireAuth() so we return
// a JSON 401 instead of an HTML redirect.
// ---------------------------------------------------------------------------
router.use((req, res, next) => {
  const { userId } = getAuth(req);
  if (!userId) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  next();
});

// ---------------------------------------------------------------------------
// GET /api/devices — list all devices for the caller's organization
// ---------------------------------------------------------------------------
router.get('/', async (req, res) => {
  const tenantId = getTenantId(req, res);
  if (!tenantId) return;

  try {
    const devices = await Device.find({ tenantId }).sort({ createdAt: -1 });
    res.json({ success: true, count: devices.length, data: devices });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ---------------------------------------------------------------------------
// POST /api/devices — create a new device, stamped with the caller's tenant
// ---------------------------------------------------------------------------
router.post('/', async (req, res) => {
  const tenantId = getTenantId(req, res);
  if (!tenantId) return;

  try {
    // IMPORTANT: We spread req.body first, then override tenantId.
    // This prevents a malicious client from injecting a different tenantId.
    const device = await Device.create({ ...req.body, tenantId });
    res.status(201).json({ success: true, data: device });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ---------------------------------------------------------------------------
// GET /api/devices/:id — fetch a single device, only if it belongs to tenant
// ---------------------------------------------------------------------------
router.get('/:id', async (req, res) => {
  const tenantId = getTenantId(req, res);
  if (!tenantId) return;

  try {
    // Note: We use findOne with { _id, tenantId } instead of findById.
    // findById alone would leak devices from other organizations.
    const device = await Device.findOne({ _id: req.params.id, tenantId });
    if (!device) {
      return res.status(404).json({ success: false, error: 'Device not found' });
    }
    res.json({ success: true, data: device });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ---------------------------------------------------------------------------
// PUT /api/devices/:id — update a device (scoped to tenant)
// ---------------------------------------------------------------------------
router.put('/:id', async (req, res) => {
  const tenantId = getTenantId(req, res);
  if (!tenantId) return;

  try {
    // Strip tenantId from body to prevent a client from moving a device
    // into a different organization.
    const { tenantId: _ignored, ...updates } = req.body;

    const device = await Device.findOneAndUpdate(
      { _id: req.params.id, tenantId },
      updates,
      { new: true, runValidators: true }
    );

    if (!device) {
      return res.status(404).json({ success: false, error: 'Device not found' });
    }
    res.json({ success: true, data: device });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ---------------------------------------------------------------------------
// DELETE /api/devices/:id — delete a device (scoped to tenant)
// ---------------------------------------------------------------------------
router.delete('/:id', async (req, res) => {
  const tenantId = getTenantId(req, res);
  if (!tenantId) return;

  try {
    const device = await Device.findOneAndDelete({ _id: req.params.id, tenantId });
    if (!device) {
      return res.status(404).json({ success: false, error: 'Device not found' });
    }
    res.json({ success: true, data: device });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;