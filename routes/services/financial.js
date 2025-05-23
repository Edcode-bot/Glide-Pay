const express = require('express');
const router = express.Router();
const Loan = require('../../models/Loan');
const Savings = require('../../models/Savings');
const auth = require('../../middleware/auth');

// ============= Loan Routes =============

// Get loan products/types
router.get('/loans/products', async (req, res) => {
    try {
        const loanProducts = {
            personal: {
                name: 'Personal Loan',
                maxAmount: 50000,
                minAmount: 1000,
                interestRate: 15,
                maxTerm: 60, // months
                requirements: ['ID', 'Income Proof', 'Bank Statements']
            },
            business: {
                name: 'Business Loan',
                maxAmount: 500000,
                minAmount: 10000,
                interestRate: 12,
                maxTerm: 84,
                requirements: ['Business Registration', 'Financial Statements', 'Tax Returns']
            },
            education: {
                name: 'Education Loan',
                maxAmount: 100000,
                minAmount: 5000,
                interestRate: 8,
                maxTerm: 120,
                requirements: ['Admission Letter', 'Academic Records', 'Guardian Details']
            },
            mortgage: {
                name: 'Mortgage Loan',
                maxAmount: 1000000,
                minAmount: 50000,
                interestRate: 6,
                maxTerm: 360,
                requirements: ['Property Details', 'Income Proof', 'Credit Score']
            }
        };
        
        res.json(loanProducts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Apply for loan
router.post('/loans/apply', auth, async (req, res) => {
    try {
        const loan = new Loan({
            ...req.body,
            user: req.user._id,
            status: 'pending'
        });
        
        await loan.save();
        res.status(201).json(loan);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Get user's loans
router.get('/loans', auth, async (req, res) => {
    try {
        const { status, type, page = 1, limit = 10 } = req.query;
        
        const query = { user: req.user._id };
        if (status) query.status = status;
        if (type) query.type = type;
        
        const loans = await Loan.find(query)
            .sort({ createdAt: 'desc' })
            .skip((page - 1) * limit)
            .limit(limit);
            
        const total = await Loan.countDocuments(query);
        
        res.json({
            loans,
            total,
            pages: Math.ceil(total / limit),
            currentPage: page
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get loan details
router.get('/loans/:id', auth, async (req, res) => {
    try {
        const loan = await Loan.findById(req.params.id);
        
        if (!loan) {
            return res.status(404).json({ message: 'Loan not found' });
        }
        
        if (loan.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        
        res.json(loan);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Upload loan document
router.post('/loans/:id/documents', auth, async (req, res) => {
    try {
        const loan = await Loan.findById(req.params.id);
        
        if (!loan) {
            return res.status(404).json({ message: 'Loan not found' });
        }
        
        if (loan.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        
        const { type, url } = req.body;
        loan.documents.push({ type, url, verified: false });
        await loan.save();
        
        res.status(201).json(loan);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Make loan payment
router.post('/loans/:id/payment', auth, async (req, res) => {
    try {
        const loan = await Loan.findById(req.params.id);
        
        if (!loan) {
            return res.status(404).json({ message: 'Loan not found' });
        }
        
        if (loan.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        
        const { amount, paymentMethod } = req.body;
        const currentPayment = loan.repaymentSchedule.find(p => p.status === 'pending');
        
        if (!currentPayment) {
            return res.status(400).json({ message: 'No pending payment found' });
        }
        
        currentPayment.status = 'paid';
        currentPayment.paidAmount = amount;
        currentPayment.paidDate = new Date();
        
        await loan.save();
        res.json(loan);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// ============= Savings Routes =============

// Get savings products
router.get('/savings/products', async (req, res) => {
    try {
        const savingsProducts = {
            fixed_deposit: {
                name: 'Fixed Deposit',
                minAmount: 1000,
                interestRates: [
                    { term: 3, rate: 5 }, // 3 months
                    { term: 6, rate: 6 },
                    { term: 12, rate: 7 }
                ],
                features: ['Guaranteed Returns', 'Fixed Term', 'Higher Interest Rates']
            },
            goal_based: {
                name: 'Goal Savings',
                minAmount: 100,
                features: ['Flexible Deposits', 'Goal Tracking', 'Auto-save Option']
            },
            group_savings: {
                name: 'Group Savings',
                minAmount: 50,
                features: ['Group Contributions', 'Rotating Payouts', 'Social Saving']
            }
        };
        
        res.json(savingsProducts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create savings account
router.post('/savings', auth, async (req, res) => {
    try {
        const savings = new Savings({
            ...req.body,
            user: req.user._id,
            status: 'active'
        });
        
        await savings.save();
        res.status(201).json(savings);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Get user's savings accounts
router.get('/savings', auth, async (req, res) => {
    try {
        const { type, status, page = 1, limit = 10 } = req.query;
        
        const query = { user: req.user._id };
        if (type) query.type = type;
        if (status) query.status = status;
        
        const savings = await Savings.find(query)
            .sort({ createdAt: 'desc' })
            .skip((page - 1) * limit)
            .limit(limit);
            
        const total = await Savings.countDocuments(query);
        
        res.json({
            savings,
            total,
            pages: Math.ceil(total / limit),
            currentPage: page
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get savings account details
router.get('/savings/:id', auth, async (req, res) => {
    try {
        const savings = await Savings.findById(req.params.id)
            .populate('groupSavings.members.user', 'name email');
        
        if (!savings) {
            return res.status(404).json({ message: 'Savings account not found' });
        }
        
        if (savings.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        
        res.json(savings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Make deposit to savings
router.post('/savings/:id/deposit', auth, async (req, res) => {
    try {
        const savings = await Savings.findById(req.params.id);
        
        if (!savings) {
            return res.status(404).json({ message: 'Savings account not found' });
        }
        
        if (savings.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        
        const { amount, method } = req.body;
        
        savings.currentBalance += amount;
        savings.transactions.push({
            type: 'deposit',
            amount,
            status: 'completed',
            reference: `DEP${Date.now()}`
        });
        
        await savings.save();
        res.json(savings);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Withdraw from savings
router.post('/savings/:id/withdraw', auth, async (req, res) => {
    try {
        const savings = await Savings.findById(req.params.id);
        
        if (!savings) {
            return res.status(404).json({ message: 'Savings account not found' });
        }
        
        if (savings.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        
        const { amount, method } = req.body;
        
        if (amount > savings.currentBalance) {
            return res.status(400).json({ message: 'Insufficient balance' });
        }
        
        savings.currentBalance -= amount;
        savings.transactions.push({
            type: 'withdrawal',
            amount,
            status: 'completed',
            reference: `WIT${Date.now()}`
        });
        
        await savings.save();
        res.json(savings);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Setup auto-save
router.post('/savings/:id/auto-save', auth, async (req, res) => {
    try {
        const savings = await Savings.findById(req.params.id);
        
        if (!savings) {
            return res.status(404).json({ message: 'Savings account not found' });
        }
        
        if (savings.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        
        const { amount, frequency } = req.body;
        
        savings.autoSave = {
            enabled: true,
            amount,
            frequency,
            nextDeductionDate: calculateNextDeductionDate(frequency)
        };
        
        await savings.save();
        res.json(savings);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Join group savings
router.post('/savings/:id/join-group', auth, async (req, res) => {
    try {
        const savings = await Savings.findById(req.params.id);
        
        if (!savings) {
            return res.status(404).json({ message: 'Savings account not found' });
        }
        
        if (!savings.groupSavings.isGroup) {
            return res.status(400).json({ message: 'Not a group savings account' });
        }
        
        if (savings.groupSavings.members.length >= savings.groupSavings.maxMembers) {
            return res.status(400).json({ message: 'Group is full' });
        }
        
        const { contributionAmount } = req.body;
        
        savings.groupSavings.members.push({
            user: req.user._id,
            contributionAmount,
            role: 'member'
        });
        
        await savings.save();
        res.json(savings);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Helper function to calculate next deduction date
function calculateNextDeductionDate(frequency) {
    const now = new Date();
    switch (frequency) {
        case 'daily':
            return new Date(now.setDate(now.getDate() + 1));
        case 'weekly':
            return new Date(now.setDate(now.getDate() + 7));
        case 'monthly':
            return new Date(now.setMonth(now.getMonth() + 1));
        default:
            return now;
    }
}

module.exports = router; 