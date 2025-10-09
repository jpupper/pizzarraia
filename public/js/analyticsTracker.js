// Analytics Tracker - Rastrea interacciones del usuario
class AnalyticsTracker {
    constructor(socket, sessionId, userId, username) {
        this.socket = socket;
        this.sessionId = sessionId || '0';
        this.userId = userId || null;
        this.username = username || 'Anónimo';
        this.isTracking = true;
        this.throttleDelay = 500; // ms between tracked events
        this.lastTrackTime = 0;
        
        this.init();
    }
    
    init() {
        // Track clicks
        document.addEventListener('click', (e) => {
            this.trackInteraction('click', {
                x: e.clientX,
                y: e.clientY,
                target: e.target.tagName
            });
        });
        
        // Track touches (mobile)
        document.addEventListener('touchstart', (e) => {
            if (e.touches.length > 0) {
                this.trackInteraction('touch', {
                    x: e.touches[0].clientX,
                    y: e.touches[0].clientY,
                    touches: e.touches.length
                });
            }
        });
        
        console.log('Analytics Tracker initialized');
    }
    
    trackInteraction(type, metadata = {}) {
        if (!this.isTracking) return;
        
        // Throttle tracking to avoid overwhelming the server
        const now = Date.now();
        if (now - this.lastTrackTime < this.throttleDelay) {
            return;
        }
        this.lastTrackTime = now;
        
        const data = {
            sessionId: this.sessionId,
            userId: this.userId,
            username: this.username,
            interactionType: type,
            metadata: metadata
        };
        
        // Send via socket for real-time updates
        if (this.socket && this.socket.connected) {
            this.socket.emit('track_interaction', data);
        }
    }
    
    // Track specific drawing actions
    trackDraw(brushType) {
        this.trackInteraction('draw', {
            brushType: brushType
        });
    }
    
    // Track brush changes
    trackBrushChange(brushType) {
        this.trackInteraction('brush_change', {
            brushType: brushType
        });
    }
    
    // Track color changes
    trackColorChange(color) {
        this.trackInteraction('color_change', {
            color: color
        });
    }
    
    // Update user info
    updateUserInfo(userId, username) {
        this.userId = userId;
        this.username = username;
    }
    
    // Update session
    updateSession(sessionId) {
        this.sessionId = sessionId;
    }
    
    // Enable/disable tracking
    setTracking(enabled) {
        this.isTracking = enabled;
    }
}

// Export for use in other files
if (typeof window !== 'undefined') {
    window.AnalyticsTracker = AnalyticsTracker;
}
