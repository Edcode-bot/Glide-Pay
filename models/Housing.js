const mongoose = require('mongoose');

const housingSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['apartment', 'house', 'room', 'hotel', 'villa', 'office'],
        required: true
    },
    listingType: {
        type: String,
        enum: ['rent', 'short_stay', 'airbnb'],
        required: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    location: {
        address: String,
        city: {
            type: String,
            required: true
        },
        state: String,
        country: {
            type: String,
            required: true
        },
        coordinates: {
            latitude: Number,
            longitude: Number
        }
    },
    details: {
        bedrooms: Number,
        bathrooms: Number,
        size: Number, // in square meters/feet
        furnished: Boolean,
        amenities: [String]
    },
    pricing: {
        price: {
            type: Number,
            required: true
        },
        period: {
            type: String,
            enum: ['night', 'week', 'month', 'year'],
            required: true
        },
        securityDeposit: Number,
        utilities: {
            included: Boolean,
            details: String
        }
    },
    availability: {
        isAvailable: {
            type: Boolean,
            default: true
        },
        availableFrom: Date,
        availableTo: Date,
        bookedDates: [{
            from: Date,
            to: Date,
            bookedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            }
        }]
    },
    images: [{
        url: String,
        caption: String
    }],
    rules: [String],
    ratings: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        rating: {
            type: Number,
            min: 1,
            max: 5
        },
        review: String,
        date: {
            type: Date,
            default: Date.now
        }
    }],
    verificationStatus: {
        type: String,
        enum: ['pending', 'verified', 'rejected'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

housingSchema.index({ 'location.city': 'text', 'location.country': 'text', title: 'text' });

const Housing = mongoose.model('Housing', housingSchema);
module.exports = Housing; 