import express from 'express';
import { Farmer } from '../models/farmer';
import { FarmerDetails } from '../types';

const router = express.Router();

// Register a new farmer
router.post('/register', async (req, res) => {
  try {
    console.log('Received registration request:', req.body);
    const farmerData: FarmerDetails = req.body;

    // Create a new farmer document
    const farmer = new Farmer({
      name: farmerData.name,
      gender: farmerData.gender,
      nationalId: farmerData.nationalId,
      mobileNumber: farmerData.mobileNumber,
      county: farmerData.county,
      ward: farmerData.ward,
      crop: farmerData.crop,
      acres: farmerData.acres,
      premium: farmerData.premium,
    });

    // Save the farmer to the database
    const savedFarmer = await farmer.save();
    console.log('Farmer saved successfully:', savedFarmer);

    res.json({ success: true, id: savedFarmer._id });
  } catch (error: unknown) {
    console.error('Error registering farmer:', error);
    if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
      res.status(400).json({ success: false, message: 'National ID already registered' });
    } else {
      res.status(500).json({ success: false, message: 'Failed to register farmer' });
    }
  }
});

// Sync offline registrations
router.post('/sync', async (req, res) => {
  try {
    const farmers: FarmerDetails[] = req.body;
    const results: Array<{ nationalId: string; status: 'synced' | 'already_exists' }> = [];

    for (const farmerData of farmers) {
      try {
        // Try to create a new farmer, if nationalId exists, skip it
        const farmer = new Farmer({
          name: farmerData.name,
          gender: farmerData.gender,
          nationalId: farmerData.nationalId,
          mobileNumber: farmerData.mobileNumber,
          county: farmerData.county,
          ward: farmerData.ward,
          crop: farmerData.crop,
          acres: farmerData.acres,
          premium: farmerData.premium,
        });

        await farmer.save();
        results.push({ nationalId: farmerData.nationalId, status: 'synced' });
      } catch (err: unknown) {
        if (err && typeof err === 'object' && 'code' in err && err.code === 11000) {
          results.push({ nationalId: farmerData.nationalId, status: 'already_exists' });
        } else {
          throw err;
        }
      }
    }

    res.json({ success: true, results });
  } catch (error: unknown) {
    console.error('Error syncing farmers:', error);
    res.status(500).json({ success: false, message: 'Failed to sync farmers' });
  }
});

// Get farmer by ID
router.get('/:id', async (req, res) => {
  try {
    const farmer = await Farmer.findById(req.params.id);

    if (!farmer) {
      res.status(404).json({ success: false, message: 'Farmer not found' });
      return;
    }

    res.json({ success: true, farmer });
  } catch (error: unknown) {
    console.error('Error getting farmer:', error);
    res.status(500).json({ success: false, message: 'Failed to get farmer' });
  }
});

// Bulk register farmers
router.post('/bulk', async (req, res) => {
  try {
    const farmers: FarmerDetails[] = req.body;
    const results: Array<{ id: string; nationalId: string }> = [];

    for (const farmerData of farmers) {
      try {
        const farmer = new Farmer({
          name: farmerData.name,
          gender: farmerData.gender,
          nationalId: farmerData.nationalId,
          mobileNumber: farmerData.mobileNumber,
          county: farmerData.county,
          ward: farmerData.ward,
          crop: farmerData.crop,
          acres: farmerData.acres,
          premium: farmerData.premium,
        });

        const savedFarmer = await farmer.save();
        results.push({
          id: savedFarmer._id.toString(),
          nationalId: savedFarmer.nationalId
        });
      } catch (error: unknown) {
        console.error('Error in bulk registration:', error);
        // Skip failed registrations but continue with others
      }
    }

    res.json({
      success: true,
      farmers: results
    });
  } catch (error: unknown) {
    console.error('Error in bulk registration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register farmers'
    });
  }
});

export default router;
