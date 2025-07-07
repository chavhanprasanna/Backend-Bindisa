import Farm from '../models/Farm.js';

export async function createFarm(req, res, next) {
  try {
    const { farmName, location, sizeAcres } = req.body;
    const { latitude, longitude } = location;

    const farmData = {
      ownerId: req.user.sub,
      farmName,
      location: {
        village: location.village,
        district: location.district,
        state: location.state,
      },
      sizeAcres,
    };

    // Only add geo object if coordinates are valid
    if (latitude && longitude) {
      farmData.location.geo = {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
      };
    }

    const farm = await Farm.create(farmData);
    res.status(201).json(farm);
  } catch (err) {
    next(err);
  }
}

export async function listFarms(req, res, next) {
  try {
    const farms = await Farm.find({ ownerId: req.user.sub });
    res.json(farms);
  } catch (err) {
    next(err);
  }
}

export async function getFarm(req, res, next) {
  try {
    const farm = await Farm.findOne({ _id: req.params.id, ownerId: req.user.sub });
    if (!farm) return res.status(404).json({ message: 'Not found' });
    res.json(farm);
  } catch (err) {
    next(err);
  }
}

export async function updateFarm(req, res, next) {
  try {
    const farm = await Farm.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.user.sub },
      req.body,
      { new: true },
    );
    if (!farm) return res.status(404).json({ message: 'Not found' });
    res.json(farm);
  } catch (err) {
    next(err);
  }
}
