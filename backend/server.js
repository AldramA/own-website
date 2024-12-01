require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const NodeCache = require('node-cache');
const useragent = require('express-useragent');
const visitorTracker = require('./middleware/visitorTracker');
const visitorModel = require('./models/visitor');

const app = express();
const cache = new NodeCache({ stdTTL: 600 }); // Cache for 10 minutes

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    optionsSuccessStatus: 200
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));
app.use(useragent.express());

// Initialize visitor model
app.locals.visitorModel = visitorModel;

// Add visitor tracking
app.use(visitorTracker);

// GitHub API configuration
const githubAPI = axios.create({
    baseURL: 'https://api.github.com',
    headers: {
        'Authorization': `token ${process.env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
    }
});

// Email transporter configuration
const transporter = require('nodemailer').createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Helper function to get repository details
async function getRepoDetails(repoName) {
    try {
        // First check if the repository exists
        const repoData = await githubAPI.get(`/repos/${process.env.GITHUB_USERNAME}/${repoName}`);
        
        // If repository exists, get additional details
        const [languages, contents] = await Promise.all([
            githubAPI.get(`/repos/${process.env.GITHUB_USERNAME}/${repoName}/languages`),
            githubAPI.get(`/repos/${process.env.GITHUB_USERNAME}/${repoName}/contents`)
                .catch(() => ({ data: [] })) // Return empty array if contents can't be fetched
        ]);

        // Extract directory structure (handle case where contents might be empty)
        const structure = Array.isArray(contents.data) ? contents.data.map(item => ({
            name: item.name,
            type: item.type,
            path: item.path
        })) : [];

        return {
            name: repoData.data.name,
            description: repoData.data.description || 'No description available',
            url: repoData.data.html_url,
            languages: languages.data,
            structure: structure,
            topics: repoData.data.topics || [],
            created_at: repoData.data.created_at,
            updated_at: repoData.data.updated_at,
            stargazers_count: repoData.data.stargazers_count,
            visibility: repoData.data.visibility,
            default_branch: repoData.data.default_branch
        };
    } catch (error) {
        if (error.response && error.response.status === 404) {
            console.log(`Repository ${repoName} not found or not accessible`);
            return null;
        }
        console.error(`Error fetching details for ${repoName}:`, error.message);
        return null;
    }
}

// API Routes
app.get('/api/portfolio', async (req, res) => {
    try {
        // Check cache first
        const cachedData = cache.get('portfolio');
        if (cachedData) {
            return res.json(cachedData);
        }

        // Get user's repositories
        const { data: repos } = await githubAPI.get(`/users/${process.env.GITHUB_USERNAME}/repos`, {
            params: {
                sort: 'updated',
                direction: 'desc',
                per_page: 100
            }
        });
        
        // Filter out forks and get details for each repository
        const portfolioProjects = await Promise.all(
            repos
                .filter(repo => !repo.fork && repo.visibility !== 'private')
                .map(async repo => await getRepoDetails(repo.name))
        );

        // Filter out null results and sort by update date
        const validProjects = portfolioProjects
            .filter(project => project !== null)
            .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

        // Cache the results
        cache.set('portfolio', validProjects);

        res.json(validProjects);
    } catch (error) {
        console.error('Error fetching portfolio:', error.message);
        res.status(500).json({ 
            error: 'Failed to fetch portfolio data',
            message: error.message 
        });
    }
});

// Contact form endpoint
app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, message } = req.body;

        // Validate input
        if (!name || !email || !message) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Email validation regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        // Configure email
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER, // Send to yourself
            replyTo: email,
            subject: `Portfolio Contact: ${name}`,
            text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
            html: `
                <h3>New Contact Form Submission</h3>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <h4>Message:</h4>
                <p>${message.replace(/\n/g, '<br>')}</p>
            `
        };

        // Send email
        await transporter.sendMail(mailOptions);

        res.json({ message: 'Message sent successfully' });
    } catch (error) {
        console.error('Email error:', error);
        res.status(500).json({ 
            error: 'Failed to send message',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Analytics Routes
app.get('/api/analytics', (req, res) => {
    try {
        const stats = visitorModel.getStats();
        res.json(stats);
    } catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({ error: 'Failed to fetch analytics data' });
    }
});

app.get('/api/analytics/daily', async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 7;
        const stats = visitorModel.getDailyStats(days);
        res.json(stats);
    } catch (error) {
        console.error('Error fetching daily analytics:', error);
        res.status(500).json({ error: 'Failed to fetch daily analytics data' });
    }
});

// Route to clear cache (useful for development)
app.post('/api/clear-cache', (req, res) => {
    cache.flushAll();
    res.json({ message: 'Cache cleared successfully' });
});

// Serve frontend files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.get('/admin/analytics', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/admin/analytics.html'));
});

// Handle 404s
app.use((req, res) => {
    // Check if the request is for an API endpoint
    if (req.path.startsWith('/api/')) {
        res.status(404).json({ error: 'API endpoint not found' });
    } else {
        // For non-API routes, send the index.html file
        res.status(404).sendFile(path.join(__dirname, '../frontend/404.html'));
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    if (req.path.startsWith('/api/')) {
        res.status(500).json({ error: 'Internal server error' });
    } else {
        res.status(500).sendFile(path.join(__dirname, '../frontend/500.html'));
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
