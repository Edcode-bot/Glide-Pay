const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['personal', 'business', 'education', 'mortgage', 'vehicle', 'bnpl'],
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    term: {
        duration: {
            type: Number,
            required: true
        },
        unit: {
            type: String,
            enum: ['days', 'weeks', 'months', 'years'],
            required: true
        }
    },
    interestRate: {
        type: Number,
        required: true,
        min: 0
    },
    purpose: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'active', 'closed', 'defaulted'],
        default: 'pending'
    },
    collateral: {
        type: {
            type: String,
            enum: ['property', 'vehicle', 'savings', 'other']
        },
        description: String,
        value: Number,
        documents: [String]
    },
    documents: [{
        type: {
            type: String,
            enum: ['id', 'income_proof', 'address_proof', 'bank_statement', 'other']
        },
        url: String,
        verified: Boolean
    }],
    repaymentSchedule: [{
        dueDate: Date,
        amount: Number,
        status: {
            type: String,
            enum: ['pending', 'paid', 'overdue'],
            default: 'pending'
        },
        paidAmount: {
            type: Number,
            default: 0
        },
        paidDate: Date
    }],
    creditScore: {
        score: Number,
        lastChecked: Date
    },
    approvalDetails: {
        approvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        approvedAt: Date,
        notes: String
    },
    disbursement: {
        method: {
            type: String,
            enum: ['bank_transfer', 'wallet', 'cash']
        },
        status: {
            type: String,
            enum: ['pending', 'completed', 'failed']
        },
        date: Date,
        reference: String
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

loanSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const Loan = mongoose.model('Loan', loanSchema);
module.exports = Loan; 