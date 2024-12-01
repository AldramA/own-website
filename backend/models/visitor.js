const fs = require('fs');
const path = require('path');

class VisitorModel {
    constructor() {
        this.dataFile = path.join(__dirname, '../data/visitors.json');
        this.data = this.loadData();
        // Initialize Set from array if loading from file, or create new Set
        this.uniqueVisitors = new Set(this.data.uniqueVisitors || []);
        // Convert legacy path data to new format
        this.convertLegacyPaths();
    }

    convertLegacyPaths() {
        const paths = this.data.paths;
        for (const [pathKey, value] of Object.entries(paths)) {
            if (typeof value === 'number') {
                paths[pathKey] = {
                    views: value,
                    totalDuration: 0,
                    avgDuration: 0
                };
            }
        }
    }

    loadData() {
        try {
            if (fs.existsSync(this.dataFile)) {
                const data = JSON.parse(fs.readFileSync(this.dataFile, 'utf8'));
                return {
                    totalVisits: data.totalVisits || 0,
                    dailyVisits: data.dailyVisits || {},
                    browsers: data.browsers || {},
                    countries: data.countries || {},
                    paths: data.paths || {},
                    lastVisits: data.lastVisits || [],
                    visitDurations: data.visitDurations || [],
                    uniqueVisitors: data.uniqueVisitors || [],
                    averageVisitDuration: data.averageVisitDuration || 0,
                    returnRate: data.returnRate || 0
                };
            }
        } catch (error) {
            console.error('Error loading visitor data:', error);
        }

        return {
            totalVisits: 0,
            dailyVisits: {},
            browsers: {},
            countries: {},
            paths: {},
            lastVisits: [],
            visitDurations: [],
            uniqueVisitors: [],
            averageVisitDuration: 0,
            returnRate: 0
        };
    }

    saveData() {
        try {
            // Convert Set to Array for JSON serialization
            const dataToSave = {
                ...this.data,
                uniqueVisitors: Array.from(this.uniqueVisitors)
            };
            fs.writeFileSync(this.dataFile, JSON.stringify(dataToSave, null, 2));
        } catch (error) {
            console.error('Error saving visitor data:', error);
        }
    }

    trackVisit(visitorData) {
        // Update total visits
        this.data.totalVisits++;

        // Update daily visits with correct timezone handling
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const today = now.toISOString().split('T')[0];
        this.data.dailyVisits[today] = (this.data.dailyVisits[today] || 0) + 1;

        // Track unique visitors
        const visitorId = `${visitorData.ip}-${visitorData.userAgent}`;
        const isNewVisitor = !this.uniqueVisitors.has(visitorId);
        this.uniqueVisitors.add(visitorId);

        // Update return rate
        const totalUnique = this.uniqueVisitors.size;
        this.data.returnRate = totalUnique > 0 ? 
            ((this.data.totalVisits - totalUnique) / this.data.totalVisits) * 100 : 0;

        // Update browser stats
        const browser = visitorData.browser || 'Unknown';
        this.data.browsers[browser] = (this.data.browsers[browser] || 0) + 1;

        // Update country stats
        const country = visitorData.country || 'Unknown';
        this.data.countries[country] = (this.data.countries[country] || 0) + 1;

        // Update path stats
        const path = visitorData.path || '/';
        if (!this.data.paths[path] || typeof this.data.paths[path] === 'number') {
            this.data.paths[path] = {
                views: typeof this.data.paths[path] === 'number' ? this.data.paths[path] : 0,
                totalDuration: 0,
                avgDuration: 0
            };
        }
        this.data.paths[path].views++;

        // Add visit duration if provided
        if (visitorData.duration) {
            this.data.visitDurations.push(visitorData.duration);
            this.data.paths[path].totalDuration += visitorData.duration;
            this.data.paths[path].avgDuration = 
                this.data.paths[path].totalDuration / this.data.paths[path].views;
            
            // Update average visit duration
            const totalDuration = this.data.visitDurations.reduce((a, b) => a + b, 0);
            this.data.averageVisitDuration = totalDuration / this.data.visitDurations.length;
        }

        // Add to recent visits (keep last 100)
        this.data.lastVisits.unshift({
            timestamp: new Date().toISOString(),
            path: path,
            browser: browser,
            country: country,
            isNewVisitor: isNewVisitor,
            duration: visitorData.duration || 0
        });
        this.data.lastVisits = this.data.lastVisits.slice(0, 100);

        // Save the updated data
        this.saveData();
    }

    getDailyStats(days = 7) {
        const dailyStats = [];
        const today = new Date();
        
        // Get current date without time
        today.setHours(0, 0, 0, 0);
        
        // Calculate dates and visits
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            dailyStats.push({
                date: dateStr,
                visits: this.data.dailyVisits[dateStr] || 0
            });
        }
        
        return dailyStats;
    }

    getStats() {
        return {
            totalVisits: this.data.totalVisits,
            dailyStats: this.getDailyStats(),
            browsers: this.data.browsers,
            countries: this.data.countries,
            paths: this.data.paths,
            lastVisits: this.data.lastVisits,
            averageVisitDuration: this.data.averageVisitDuration,
            returnRate: this.data.returnRate
        };
    }
}

module.exports = new VisitorModel();
