const mongoose = require('mongoose');

const billSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['electricity', 'water', 'internet', 'tv', 'gas', 'telephone', 'tax', 'school_fees', 'other'],
        required: true
    },
    provider: {
        name: {
            type: String,
            required: true
        },
        accountNumber: String,
        meterNumber: String,
        customerId: String
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    dueDate: Date,
    status: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'overdue'],
        default: 'pending'
    },
    paymentInfo: {
        method: {
            type: String,
            enum: ['card', 'bank_transfer', 'wallet', 'crypto'],
            required: true
        },
        transactionId: String,
        paidAt: Date,
        receipt: String
    },
    isRecurring: {
        type: Boolean,
        default: false
    },
    recurringSchedule: {
        frequency: {
            type: String,
            enum: ['monthly', 'quarterly', 'yearly']
        },
        nextPaymentDate: Date,
        lastPaymentDate: Date
    },
    notifications: [{
        type: {
            type: String,
            enum: ['reminder', 'due', 'overdue', 'paid']
        },
        message: String,
        sentAt: Date
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

billSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const Bill = mongoose.model('Bill', billSchema);
module.exports = Bill; 