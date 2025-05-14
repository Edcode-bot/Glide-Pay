const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const bcrypt = require('bcrypt');
const connectDB = require('./db');
const multer = require('multer');
const fs = require('fs');

const User = require('./models/User');
const Message = require('./models/Message');
const Transaction = require('./models/Transaction');
const Notification = require('./models/Notification');

const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

// Connect DB
connectDB();

// Ensure uploads folder exists
if (!fs.existsSync('./uploads')) fs.mkdirSync('./uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, unique + '-' + file.originalname);
  }
});
const upload = multer({ storage });

app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: 'axe_secret_key',
  resave: false,
  saveUninitialized: true
}));

// Socket.io real-time chat
io.on('connection', socket => {
  socket.on('joinRoom', ({ userId, otherUserId }) => {
    const room = [userId, otherUserId].sort().join('_');
    socket.join(room);
  });

  socket.on('sendMessage', async ({ senderId, recipientId, content }) => {
    const room = [senderId, recipientId].sort().join('_');
    const message = new Message({ sender: senderId, recipient: recipientId, content });
    await message.save();

    const notify = new Notification({
      user: recipientId,
      message: 'You received a new message',
      type: 'message'
    });
    await notify.save();

    io.to(room).emit('newMessage', { senderId, content, timestamp: new Date() });
  });
});

// ROUTES
app.get('/', (req, res) => res.redirect('/login'));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public/login.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, 'public/register.html')));
app.get('/welcome', (req, res) => {
  if (!req.session.userId) return res.redirect('/login');
  if (req.session.seenWelcome) return res.redirect('/main');
  res.sendFile(path.join(__dirname, 'public/welcome.html'));
});
app.get('/main', (req, res) => {
  if (!req.session.userId) return res.redirect('/login');
  req.session.seenWelcome = true;
  res.sendFile(path.join(__dirname, 'public/main.html'));
});
app.get('/chat', (req, res) => {
  if (!req.session.userId) return res.redirect('/login');
  res.sendFile(path.join(__dirname, 'public/chat.html'));
});

// AUTH
app.post('/register', async (req, res) => {
  const { name, phone, password } = req.body;
  try {
    const existingUser = await User.findOne({ phone });
    if (existingUser) return res.send('User already exists.');
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, phone, password: hashedPassword });
    await newUser.save();
    res.send('Registration successful.');
  } catch (err) {
    console.error(err);
    res.status(500).send('Registration failed.');
  }
});

app.post('/login', async (req, res) => {
  const { phone, password } = req.body;
  try {
    const user = await User.findOne({ phone });
    if (!user) return res.send('User not found.');
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.send('Incorrect password.');
    req.session.userId = user._id;
    req.session.seenWelcome = false;
    res.redirect('/welcome');
  } catch (err) {
    console.error(err);
    res.status(500).send('Login failed.');
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

// Chat
app.get('/messages', async (req, res) => {
  if (!req.session.userId) return res.status(401).json([]);
  const withUser = req.query.with;

  try {
    const messages = await Message.find({
      $or: [
        { sender: req.session.userId, recipient: withUser },
        { sender: withUser, recipient: req.session.userId }
      ]
    }).sort({ timestamp: 1 });

    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json([]);
  }
});

app.get('/resolve-phone', async (req, res) => {
  const phone = req.query.number;
  if (!phone) return res.status(400).json({ error: 'Phone number required' });

  const user = await User.findOne({ phone });
  if (!user) return res.json({ userId: null });

  res.json({ userId: user._id });
});

app.post('/upload-chat-file', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const fileUrl = '/uploads/' + req.file.filename;
  res.json({ url: fileUrl });
});

// Notifications
app.get('/notifications', async (req, res) => {
  if (!req.session.userId) return res.status(401).json([]);
  const notes = await Notification.find({ user: req.session.userId }).sort({ timestamp: -1 });
  res.json(notes);
});

app.post('/notifications/mark-read', async (req, res) => {
  if (!req.session.userId) return res.status(401).send('Unauthorized');
  await Notification.updateMany({ user: req.session.userId, isRead: false }, { $set: { isRead: true } });
  res.send('All notifications marked as read.');
});

// Wallet & Transactions
app.post('/add-cash', async (req, res) => {
  if (!req.session.userId) return res.status(401).send('Unauthorized');
  const { amount } = req.body;
  try {
    const tx = new Transaction({ user: req.session.userId, amount, type: 'Add Cash' });
    await tx.save();
    res.status(200).send('Cash added');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error adding cash');
  }
});

app.post('/withdraw-cash', async (req, res) => {
  if (!req.session.userId) return res.status(401).send('Unauthorized');
  const { amount } = req.body;
  try {
    const tx = new Transaction({ user: req.session.userId, amount, type: 'Withdraw' });
    await tx.save();
    res.status(200).send('Cash withdrawn');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error withdrawing cash');
  }
});

app.get('/balance', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ balance: 0 });
  const txs = await Transaction.find({ user: req.session.userId });
  const total = txs.reduce((sum, tx) => {
    return tx.type === 'Add Cash' ? sum + tx.amount : sum - tx.amount;
  }, 0);
  res.json({ balance: total });
});

app.get('/transactions', async (req, res) => {
  if (!req.session.userId) return res.status(401).json([]);
  const txs = await Transaction.find({ user: req.session.userId }).sort({ date: -1 });
  res.json(txs.map(tx => ({ type: tx.type, amount: tx.amount })));
});

app.post('/transfer-token', async (req, res) => {
  if (!req.session.userId) return res.status(401).send('Unauthorized');
  const { currency, address, amount } = req.body;
  if (!currency || !address || !amount) return res.status(400).send('Missing fields');

  try {
    const tx = new Transaction({
      user: req.session.userId,
      type: 'Transfer',
      currency,
      address,
      amount
    });
    await tx.save();
    res.redirect('/main');
  } catch (err) {
    console.error(err);
    res.status(500).send('Transfer failed');
  }
});

// Start server
const PORT = 3000;
http.listen(PORT, () => {
  console.log(`🚀 Axe App is live at http://localhost:${PORT}`);
});