import CropSuggestion from '../models/CropSuggestion.js';

// simple rule-based crop suggestion (placeholder for real ML)
function generateSuggestions({ region, soilType, season }) {
  if (soilType?.toLowerCase().includes('black') && season === 'Kharif') {
    return [{ crop: 'Cotton', match: 95 }, { crop: 'Soybean', match: 82 }];
  }
  return [{ crop: 'Maize', match: 70 }, { crop: 'Pigeon Pea', match: 65 }];
}

export async function createSuggestion(req, res, next) {
  try {
    const requestDetails = req.body;
    const recommendedCrops = generateSuggestions(requestDetails);
    const suggestion = await CropSuggestion.create({
      userId: req.user.sub,
      requestDetails,
      recommendedCrops,
    });
    res.status(201).json(suggestion);
  } catch (err) {
    next(err);
  }
}

export async function listSuggestions(req, res, next) {
  try {
    const suggestions = await CropSuggestion.find({ userId: req.user.sub }).sort({ createdAt: -1 });
    res.json(suggestions);
  } catch (err) {
    next(err);
  }
}
