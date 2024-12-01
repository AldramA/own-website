const geoip = require('geoip-lite');
const useragent = require('express-useragent');

let visitStartTimes = new Map();

function visitorTracker(req, res, next) {
    // Skip tracking for static files and analytics endpoint
    if (req.path.startsWith('/static') || req.path === '/api/analytics') {
        return next();
    }

    // Parse user agent
    const ua = useragent.parse(req.headers['user-agent']);
    
    // Get IP address
    const ip = req.ip || 
               req.connection.remoteAddress || 
               req.socket.remoteAddress || 
               req.connection.socket.remoteAddress;
    
    // Get geolocation
    const geo = geoip.lookup(ip);
    
    // Store visit start time
    const visitId = `${ip}-${Date.now()}`;
    visitStartTimes.set(visitId, Date.now());

    // Clean up old visit times (older than 24 hours)
    const dayAgo = Date.now() - (24 * 60 * 60 * 1000);
    for (const [key, time] of visitStartTimes.entries()) {
        if (time < dayAgo) {
            visitStartTimes.delete(key);
        }
    }

    // Track end of visit
    res.on('finish', () => {
        const startTime = visitStartTimes.get(visitId);
        const duration = startTime ? Math.round((Date.now() - startTime) / 1000 / 60) : 0; // Convert to minutes
        visitStartTimes.delete(visitId);

        // Prepare visitor data
        const visitorData = {
            timestamp: new Date(),
            ip: ip,
            path: req.path,
            userAgent: req.headers['user-agent'],
            browser: `${ua.browser} ${ua.version}`,
            os: ua.os,
            platform: ua.platform,
            country: geo ? geo.country : 'Unknown',
            city: geo ? geo.city : 'Unknown',
            duration: duration
        };

        // Track the visit
        req.app.locals.visitorModel.trackVisit(visitorData);
    });

    next();
}

module.exports = visitorTracker;
