import Farm from '../models/Farm.js';
import { createSyncLog } from './offlineSyncController.js';

export const saveFarmLocation = async (req, res) => {
  try {
    const { farmId, latitude, longitude } = req.body;
    const userId = req.user._id;

    // Update farm with new location
    const farm = await Farm.findOneAndUpdate(
      { _id: farmId, farmer: userId },
      { 
        location: {
          type: 'Point',
          coordinates: [longitude, latitude] // GeoJSON uses [longitude, latitude]
        }
      },
      { new: true }
    );

    if (!farm) {
      return res.status(404).json({ message: 'Farm not found or access denied' });
    }

    // Log the sync
    await createSyncLog({
      userId,
      action: 'LOCATION_UPDATE',
      entityType: 'Farm',
      entityId: farmId,
      status: 'COMPLETED'
    });

    res.status(200).json({
      success: true,
      message: 'Location updated successfully',
      data: {
        farmId: farm._id,
        location: farm.location
      }
    });
  } catch (error) {
    console.error('Error updating farm location:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update location',
      error: error.message
    });
  }
};
