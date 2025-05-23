const express = require('express');
const router = express.Router();
const Housing = require('../../models/Housing');
const auth = require('../../middleware/auth');

// Get all listings with filtering and pagination
router.get('/listings', async (req, res) => {
    try {
        const {
            type,
            listingType,
            city,
            minPrice,
            maxPrice,
            bedrooms,
            furnished,
            sort = 'createdAt',
            order = 'desc',
            page = 1,
            limit = 10
        } = req.query;

        const query = {};
        if (type) query.type = type;
        if (listingType) query.listingType = listingType;
        if (city) query['location.city'] = new RegExp(city, 'i');
        if (bedrooms) query['details.bedrooms'] = bedrooms;
        if (furnished) query['details.furnished'] = furnished === 'true';
        if (minPrice || maxPrice) {
            query['pricing.price'] = {};
            if (minPrice) query['pricing.price'].$gte = minPrice;
            if (maxPrice) query['pricing.price'].$lte = maxPrice;
        }

        const listings = await Housing.find(query)
            .sort({ [sort]: order })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('owner', 'name email');

        const total = await Housing.countDocuments(query);

        res.json({
            listings,
            total,
            pages: Math.ceil(total / limit),
            currentPage: page
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get listing by ID
router.get('/listings/:id', async (req, res) => {
    try {
        const listing = await Housing.findById(req.params.id)
            .populate('owner', 'name email')
            .populate('ratings.user', 'name')
            .populate('availability.bookedDates.bookedBy', 'name email');

        if (!listing) {
            return res.status(404).json({ message: 'Listing not found' });
        }

        res.json(listing);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create new listing
router.post('/listings', auth, async (req, res) => {
    try {
        const listing = new Housing({
            ...req.body,
            owner: req.user._id,
            verificationStatus: 'pending'
        });

        await listing.save();
        res.status(201).json(listing);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update listing
router.put('/listings/:id', auth, async (req, res) => {
    try {
        const listing = await Housing.findById(req.params.id);

        if (!listing) {
            return res.status(404).json({ message: 'Listing not found' });
        }

        if (listing.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        Object.assign(listing, req.body);
        await listing.save();

        res.json(listing);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete listing
router.delete('/listings/:id', auth, async (req, res) => {
    try {
        const listing = await Housing.findById(req.params.id);

        if (!listing) {
            return res.status(404).json({ message: 'Listing not found' });
        }

        if (listing.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        await listing.remove();
        res.json({ message: 'Listing deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add listing rating
router.post('/listings/:id/ratings', auth, async (req, res) => {
    try {
        const listing = await Housing.findById(req.params.id);

        if (!listing) {
            return res.status(404).json({ message: 'Listing not found' });
        }

        // Check if user has previously booked this listing
        const hasBooked = listing.availability.bookedDates.some(
            booking => booking.bookedBy.toString() === req.user._id.toString()
        );

        if (!hasBooked) {
            return res.status(403).json({ message: 'Can only rate after booking' });
        }

        const rating = {
            user: req.user._id,
            rating: req.body.rating,
            review: req.body.review
        };

        listing.ratings.push(rating);
        await listing.save();

        res.status(201).json(listing);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Book a listing
router.post('/listings/:id/book', auth, async (req, res) => {
    try {
        const { checkIn, checkOut } = req.body;
        const listing = await Housing.findById(req.params.id);

        if (!listing) {
            return res.status(404).json({ message: 'Listing not found' });
        }

        // Check availability
        const isAvailable = await checkAvailability(listing, checkIn, checkOut);
        if (!isAvailable) {
            return res.status(400).json({ message: 'Dates not available' });
        }

        // Add booking
        listing.availability.bookedDates.push({
            from: new Date(checkIn),
            to: new Date(checkOut),
            bookedBy: req.user._id
        });

        await listing.save();
        res.status(201).json(listing);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Cancel booking
router.delete('/listings/:id/book/:bookingId', auth, async (req, res) => {
    try {
        const listing = await Housing.findById(req.params.id);

        if (!listing) {
            return res.status(404).json({ message: 'Listing not found' });
        }

        const bookingIndex = listing.availability.bookedDates.findIndex(
            booking => booking._id.toString() === req.params.bookingId
        );

        if (bookingIndex === -1) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        const booking = listing.availability.bookedDates[bookingIndex];
        if (booking.bookedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        listing.availability.bookedDates.splice(bookingIndex, 1);
        await listing.save();

        res.json({ message: 'Booking cancelled' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Helper function to check availability
async function checkAvailability(listing, checkIn, checkOut) {
    const start = new Date(checkIn);
    const end = new Date(checkOut);

    // Check if dates are valid
    if (start >= end) {
        throw new Error('Invalid date range');
    }

    // Check if listing is available for the period
    if (!listing.availability.isAvailable) {
        return false;
    }

    // Check if dates conflict with existing bookings
    for (const booking of listing.availability.bookedDates) {
        if (
            (start >= booking.from && start <= booking.to) ||
            (end >= booking.from && end <= booking.to) ||
            (start <= booking.from && end >= booking.to)
        ) {
            return false;
        }
    }

    return true;
}

module.exports = router; 