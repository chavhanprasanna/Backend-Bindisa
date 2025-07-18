import { Router } from 'express';
import { auth } from '../middlewares/auth.js';
import { saveFarmLocation } from '../controllers/locationController.js';
import { requestLocationPermission, checkLocationPermission } from '../middlewares/locationPermission.js';

const router = Router();

// Request location permission
router.get('/location/permission/request', auth(), requestLocationPermission);

// Check location permission status
router.get('/location/permission/status', auth(), checkLocationPermission);

// Save farm location (called after permission is granted)
router.post('/farms/:farmId/location',
  auth('FARMER', 'AGENT'),
  checkLocationPermission,
  saveFarmLocation
);

// Get nearby farms (example of using location)
router.get('/farms/nearby', auth(), (req, res) => {
  // This would be implemented to find farms near the user's location
  res.json({
    success: true,
    message: 'Nearby farms endpoint',
    note: 'Implementation would use MongoDB geospatial queries'
  });
});

export default router;
