# Portfolio Website

A terminal-themed personal portfolio website with GitHub integration and comprehensive visitor analytics.

## Features

### Core Features
- [ ] Terminal-inspired UI design
- [x] GitHub project integration
- [x] Contact form with email functionality
- [x] Visitor analytics dashboard

### Analytics Features
- [x] Page view tracking
- [x] Visitor location mapping
- [x] Browser and OS statistics
- [x] Visit duration measurement
- [x] Popular pages analysis
- [x] Return visitor tracking

## Project Structure
```
portfolio-website/
├── backend/
│   ├── data/               # Analytics data storage
│   ├── middleware/         # Express middleware
│   ├── models/            # Data models
│   ├── server.js          # Express server
│   └── .env              # Environment variables
├── frontend/
│   ├── admin/            # Admin dashboard
│   ├── assets/          # Static assets
│   │   ├── css/        # Stylesheets
│   │   ├── js/         # JavaScript files
│   │   └── img/        # Images
│   └── index.html      # Main portfolio page
```

## Setup Instructions

### Prerequisites
- Node.js v20.16.0 or higher
- npm package manager
- Gmail account for email functionality

### Installation
1. Clone the repository
```bash
git clone https://github.com/YourUsername/portfolio-website.git
cd portfolio-website
```

2. Install dependencies
```bash
cd backend
npm install
cd ../frontend
npm install
```

3. Configure environment variables
Create `.env` file in the backend directory:
```env
PORT=3000
GITHUB_USERNAME=YourGitHubUsername
GITHUB_TOKEN=YourGitHubToken
CORS_ORIGIN=http://localhost:3000
EMAIL_USER=your.email@gmail.com
EMAIL_PASS=YourAppSpecificPassword
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
```

### Running the Project
1. Start the backend server
```bash
cd backend
npm run dev
```

2. Access the website
- Main site: http://localhost:3000
- Analytics: http://localhost:3000/admin/analytics.html

## Security Considerations
- Use environment variables for sensitive data
- Implement rate limiting for API endpoints
- Set up CORS properly
- Use secure headers
- Validate and sanitize all inputs
- Implement proper error handling
- Use HTTPS in production
- Regular security audits

## Contributing
1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License
This project is licensed under the MIT License - see the LICENSE file for details.

## Contact
- Email: mu.aldarma.p@gmail.com
- GitHub: https://github.com/AldramA
- LinkedIn: https://www.linkedin.com/in/muhammed-sobhi-27b3992b9/
- Facebook: https://www.facebook.com/profile.php?id=61564013931640

## Acknowledgments
- Terminal theme inspiration
- Chart.js for analytics visualization
- Express.js framework
- Node.js community
