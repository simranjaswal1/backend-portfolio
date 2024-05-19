const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const path = require('path');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware setup
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'build')));

async function main() {
    try {
        await mongoose.connect('mongodb+srv://simran2383be22:7VMj1VQTwJareJ8G@cluster0.pxoi7os.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0');
        console.log('Connected to MongoDB');
    } catch (err) {
        console.log('MongoDB connection error:', err);
    }
}

main();

// Define User model for Auth0
const Auth0UserSchema = new mongoose.Schema({
    email: String,
    name: String,
    picture: String,
    sub: String
});
const Auth0User = mongoose.model('Auth0User', Auth0UserSchema);

// Define User model for custom signup/login
const CustomUserSchema = new mongoose.Schema({
    username: String,
    password: String
});
const CustomUser = mongoose.model('CustomUser', CustomUserSchema);

// Serve static files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Endpoint to save Auth0 user data
app.post('/api/saveUser', async (req, res) => {
    const { email, name, picture, sub } = req.body;

    try {
        let user = await Auth0User.findOne({ sub });

        if (!user) {
            user = new Auth0User({ email, name, picture, sub });
            await user.save();
        } else {
            user.email = email;
            user.name = name;
            user.picture = picture;
            await user.save();
        }

        res.status(200).json({ message: 'User data saved successfully' });
    } catch (error) {
        console.error('Error saving user data:', error);
        res.status(500).json({ message: 'Failed to save user data' });
    }
});

// Endpoint for custom signup
app.post('/signup', async (req, res) => {
    const { username, password } = req.body;
    try {
        const existingUser = await CustomUser.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new CustomUser({ username, password: hashedPassword });
        await user.save();
        res.json({ message: 'User created successfully' });
    } catch (error) {
        console.error('Error during user creation:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Endpoint for custom login
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await CustomUser.findOne({ username });
        if (!user) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }
        res.json({ message: 'Login successful' });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.listen(5000, () => {
    console.log(`Server started on port ${PORT}`);
});
