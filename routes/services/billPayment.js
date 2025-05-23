const express = require('express');
const router = express.Router();
const Bill = require('../../models/Bill');
const auth = require('../../middleware/auth');

// Get supported bill types and providers
router.get('/providers', async (req, res) => {
    try {
        const providers = {
            electricity: [
                { name: 'National Grid', code: 'NATGRID' },
                { name: 'City Power', code: 'CITYPWR' }
            ],
            water: [
                { name: 'City Water', code: 'CITYWTR' },
                { name: 'Metro Water', code: 'METROWTR' }
            ],
            internet: [
                { name: 'FastNet', code: 'FASTNET' },
                { name: 'GlobalNet', code: 'GLOBNET' }
            ],
            tv: [
                { name: 'DigiTV', code: 'DIGITV' },
                { name: 'SatelliteTV', code: 'SATTV' }
            ],
            telephone: [
                { name: 'TelCo', code: 'TELCO' },
                { name: 'GlobalTel', code: 'GLOBTEL' }
            ]
        };
        
        res.json(providers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Validate customer/meter number
router.post('/validate', auth, async (req, res) => {
    try {
        const { type, provider, accountNumber } = req.body;
        
        // Here you would typically make an API call to the provider to validate
        // For demo, we'll simulate a validation
        const isValid = accountNumber && accountNumber.length >= 6;
        
        if (!isValid) {
            return res.status(400).json({ 
                message: 'Invalid account number',
                isValid: false
            });
        }
        
        // Simulate fetching customer details
        const customerInfo = {
            name: 'John Doe',
            address: '123 Main St',
            accountBalance: 150.75,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        };
        
        res.json({
            isValid: true,
            customerInfo
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create new bill payment
router.post('/pay', auth, async (req, res) => {
    try {
        const bill = new Bill({
            ...req.body,
            user: req.user._id,
            status: 'pending'
        });
        
        await bill.save();
        
        // Here you would typically make an API call to the provider to process payment
        // For demo, we'll simulate payment processing
        bill.status = 'paid';
        bill.paymentInfo.paidAt = new Date();
        bill.paymentInfo.receipt = `RCPT${Date.now()}`;
        
        await bill.save();
        
        res.status(201).json(bill);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Get user's bill payment history
router.get('/history', auth, async (req, res) => {
    try {
        const { type, status, page = 1, limit = 10 } = req.query;
        
        const query = { user: req.user._id };
        if (type) query.type = type;
        if (status) query.status = status;
        
        const bills = await Bill.find(query)
            .sort({ createdAt: 'desc' })
            .skip((page - 1) * limit)
            .limit(limit);
            
        const total = await Bill.countDocuments(query);
        
        res.json({
            bills,
            total,
            pages: Math.ceil(total / limit),
            currentPage: page
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get bill payment details
router.get('/:id', auth, async (req, res) => {
    try {
        const bill = await Bill.findById(req.params.id);
        
        if (!bill) {
            return res.status(404).json({ message: 'Bill payment not found' });
        }
        
        if (bill.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        
        res.json(bill);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Schedule recurring bill payment
router.post('/schedule', auth, async (req, res) => {
    try {
        const { billId, frequency, startDate, endDate } = req.body;
        
        const bill = await Bill.findById(billId);
        
        if (!bill) {
            return res.status(404).json({ message: 'Bill not found' });
        }
        
        if (bill.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        
        bill.isRecurring = true;
        bill.recurringSchedule = {
            frequency,
            startDate: new Date(startDate),
            endDate: endDate ? new Date(endDate) : null
        };
        
        await bill.save();
        
        res.json(bill);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Cancel recurring bill payment
router.delete('/schedule/:id', auth, async (req, res) => {
    try {
        const bill = await Bill.findById(req.params.id);
        
        if (!bill) {
            return res.status(404).json({ message: 'Bill not found' });
        }
        
        if (bill.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        
        bill.isRecurring = false;
        bill.recurringSchedule = null;
        
        await bill.save();
        
        res.json({ message: 'Recurring payment cancelled' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router; 