const mongoose = require('mongoose');

const savingsSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['fixed_deposit', 'goal_based', 'group_savings', 'retirement', 'education', 'emergency'],
        required: true
    },
    name: {
        type: String,
        required: true
    },
    targetAmount: {
        type: Number,
        required: true,
        min: 0
    },
    currentBalance: {
        type: Number,
        default: 0,
        min: 0
    },
    currency: {
        type: String,
        required: true,
        default: 'USD'
    },
    duration: {
        startDate: {
            type: Date,
            default: Date.now
        },
        endDate: Date,
        lockPeriod: Number // in days
    },
    interestRate: {
        type: Number,
        min: 0,
        default: 0
    },
    autoSave: {
        enabled: {
            type: Boolean,
            default: false
        },
        amount: Number,
        frequency: {
            type: String,
            enum: ['daily', 'weekly', 'monthly']
        },
        nextDeductionDate: Date
    },
    groupSavings: {
        isGroup: {
            type: Boolean,
            default: false
        },
        members: [{
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            role: {
                type: String,
                enum: ['admin', 'member'],
                default: 'member'
            },
            contributionAmount: Number,
            totalContributed: {
                type: Number,
                default: 0
            },
            joinedAt: {
                type: Date,
                default: Date.now
            }
        }],
        maxMembers: Number,
        rotationSchedule: [{
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            dueDate: Date,
            status: {
                type: String,
                enum: ['pending', 'completed'],
                default: 'pending'
            }
        }]
    },
    transactions: [{
        type: {
            type: String,
            enum: ['deposit', 'withdrawal', 'interest'],
            required: true
        },
        amount: {
            type: Number,
            required: true
        },
        date: {
            type: Date,
            default: Date.now
        },
        description: String,
        status: {
            type: String,
            enum: ['pending', 'completed', 'failed'],
            default: 'pending'
        },
        reference: String
    }],
    status: {
        type: String,
        enum: ['active', 'completed', 'terminated'],
        default: 'active'
    },
    notifications: {
        enabled: {
            type: Boolean,
            default: true
        },
        channels: [{
            type: String,
            enum: ['email', 'sms', 'push']
        }]
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

savingsSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const Savings = mongoose.model('Savings', savingsSchema);
module.exports = Savings; 