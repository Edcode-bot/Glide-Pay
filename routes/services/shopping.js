const express = require('express');
const router = express.Router();
const Product = require('../../models/Product');
const Order = require('../../models/Order');
const auth = require('../../middleware/auth');

// Get all products with filtering and pagination
router.get('/products', async (req, res) => {
    try {
        const { 
            category, 
            minPrice, 
            maxPrice, 
            sort = 'createdAt', 
            order = 'desc',
            page = 1,
            limit = 10
        } = req.query;

        const query = {};
        if (category) query.category = category;
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = minPrice;
            if (maxPrice) query.price.$lte = maxPrice;
        }

        const products = await Product.find(query)
            .sort({ [sort]: order })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('vendor', 'name email');

        const total = await Product.countDocuments(query);

        res.json({
            products,
            total,
            pages: Math.ceil(total / limit),
            currentPage: page
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get product by ID
router.get('/products/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('vendor', 'name email')
            .populate('ratings.user', 'name');
        
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create new product (vendors only)
router.post('/products', auth, async (req, res) => {
    try {
        const product = new Product({
            ...req.body,
            vendor: req.user._id
        });
        
        await product.save();
        res.status(201).json(product);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update product (vendor only)
router.put('/products/:id', auth, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        
        if (product.vendor.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        
        Object.assign(product, req.body);
        await product.save();
        
        res.json(product);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete product (vendor only)
router.delete('/products/:id', auth, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        
        if (product.vendor.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        
        await product.remove();
        res.json({ message: 'Product deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add product rating
router.post('/products/:id/ratings', auth, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        
        const rating = {
            user: req.user._id,
            rating: req.body.rating,
            review: req.body.review
        };
        
        product.ratings.push(rating);
        await product.save();
        
        res.status(201).json(product);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Create order
router.post('/orders', auth, async (req, res) => {
    try {
        const order = new Order({
            ...req.body,
            user: req.user._id
        });
        
        await order.save();
        res.status(201).json(order);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Get user orders
router.get('/orders', auth, async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;
        
        const query = { user: req.user._id };
        if (status) query.status = status;
        
        const orders = await Order.find(query)
            .sort({ createdAt: 'desc' })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('items.product');
            
        const total = await Order.countDocuments(query);
        
        res.json({
            orders,
            total,
            pages: Math.ceil(total / limit),
            currentPage: page
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get order by ID
router.get('/orders/:id', auth, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('items.product')
            .populate('user', 'name email');
            
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        
        if (order.user._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update order status (admin only)
router.patch('/orders/:id/status', auth, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        
        if (!req.user.isAdmin) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        
        order.status = req.body.status;
        await order.save();
        
        res.json(order);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router; 