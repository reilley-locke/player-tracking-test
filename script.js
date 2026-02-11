const canvas = document.getElementById('touchCanvas');
const ctx = canvas.getContext('2d');

// Set canvas to full window size
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Resize canvas when window is resized
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    drawScene();
});

// Store current touch points and their history
let activeTouches = new Map(); // Map of touch identifier to {x, y}
let lastTouchSnapshot = []; // Array of {x, y} for the last touch state

// Handle touch start
canvas.addEventListener('touchstart', handleTouch);

// Handle touch move
canvas.addEventListener('touchmove', handleTouch);

// Handle touch end - capture final state before clearing
canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    
    // Remove ended touches from active touches
    const remainingTouches = Array.from(e.touches);
    const remainingIds = new Set(remainingTouches.map(t => t.identifier));
    
    // Remove touches that are no longer active
    for (let id of activeTouches.keys()) {
        if (!remainingIds.has(id)) {
            activeTouches.delete(id);
        }
    }
    
    // If no touches remain, save the snapshot
    if (activeTouches.size === 0) {
        // lastTouchSnapshot already has the final positions
    } else {
        // Update active touches for remaining fingers
        handleTouch(e);
    }
    
    drawScene();
});

// Handle touch cancel
canvas.addEventListener('touchcancel', (e) => {
    e.preventDefault();
    activeTouches.clear();
    drawScene();
});

// Update touch positions
function handleTouch(e) {
    e.preventDefault();
    
    // Clear and update active touches
    activeTouches.clear();
    
    for (let touch of e.touches) {
        const rect = canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        
        activeTouches.set(touch.identifier, { x, y });
    }
    
    // Update the snapshot with current active touches
    lastTouchSnapshot = Array.from(activeTouches.values());
    
    drawScene();
}

// Main drawing function
function drawScene() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Determine which points to draw (active touches or last snapshot)
    const pointsToDraw = activeTouches.size > 0 
        ? Array.from(activeTouches.values()) 
        : lastTouchSnapshot;
    
    if (pointsToDraw.length === 0) return;
    
    // Draw crosshairs at each touch point
    pointsToDraw.forEach(point => {
        drawCrosshair(point.x, point.y);
    });
    
    // If 2 or more points, draw lines and measurements
    if (pointsToDraw.length >= 2) {
        drawGeometry(pointsToDraw);
    }
}

// Draw a crosshair at the given position
function drawCrosshair(x, y) {
    const size = 10; // Size of crosshair arms
    
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    // Horizontal line
    ctx.moveTo(x - size, y);
    ctx.lineTo(x + size, y);
    
    // Vertical line
    ctx.moveTo(x, y - size);
    ctx.lineTo(x, y + size);
    
    ctx.stroke();
}

// Draw lines between all points and display measurements
function drawGeometry(points) {
    ctx.strokeStyle = 'red';
    ctx.fillStyle = 'red';
    ctx.lineWidth = 2;
    ctx.font = '14px Arial';
    
    // Draw lines between consecutive points (forming a polygon)
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
    }
    
    // Close the polygon if more than 2 points
    if (points.length > 2) {
        ctx.closePath();
    }
    
    ctx.stroke();
    
    // Calculate and display line lengths
    for (let i = 0; i < points.length; i++) {
        const p1 = points[i];
        const p2 = points[(i + 1) % points.length];
        
        // Don't draw the last edge if only 2 points (avoid duplicate)
        if (points.length === 2 && i === 1) break;
        
        const distance = Math.sqrt(
            Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)
        );
        
        // Position text at midpoint of line
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        
        const text = `${Math.round(distance)}px`;
        ctx.fillText(text, midX + 5, midY - 5);
    }
    
    // Calculate and display angles if more than 2 points
    if (points.length > 2) {
        for (let i = 0; i < points.length; i++) {
            const p1 = points[i];
            const p2 = points[(i + 1) % points.length];
            const p3 = points[(i + 2) % points.length];
            
            const angle = calculateAngle(p1, p2, p3);
            
            // Display angle near the vertex (p2)
            ctx.fillText(`${Math.round(angle)}°`, p2.x + 15, p2.y + 15);
        }
    }
}

// Calculate the angle at vertex p2 formed by points p1-p2-p3
function calculateAngle(p1, p2, p3) {
    // Create vectors from p2 to p1 and p2 to p3
    const v1 = { x: p1.x - p2.x, y: p1.y - p2.y };
    const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };
    
    // Calculate dot product
    const dot = v1.x * v2.x + v1.y * v2.y;
    
    // Calculate magnitudes
    const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
    const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
    
    // Calculate angle in radians, then convert to degrees
    const angleRad = Math.acos(dot / (mag1 * mag2));
    const angleDeg = angleRad * (180 / Math.PI);
    
    return angleDeg;
}

// Mouse support for testing on non-touch devices
let mouseDown = false;
let mousePosition = null;

canvas.addEventListener('mousedown', (e) => {
    mouseDown = true;
    const rect = canvas.getBoundingClientRect();
    mousePosition = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
    lastTouchSnapshot = [mousePosition];
    drawScene();
});

canvas.addEventListener('mousemove', (e) => {
    if (mouseDown) {
        const rect = canvas.getBoundingClientRect();
        mousePosition = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
        lastTouchSnapshot = [mousePosition];
        drawScene();
    }
});

canvas.addEventListener('mouseup', () => {
    mouseDown = false;
});

canvas.addEventListener('mouseleave', () => {
    mouseDown = false;
});
