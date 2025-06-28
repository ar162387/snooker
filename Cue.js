/**
 * Cue class - Represents the cue stick for hitting the cue ball
 * Handles aiming, power control, and shooting mechanics
 */
class Cue {
    /**
     * Constructor for Cue class
     * @param {number} length - Length of the cue stick
     * @param {number} tipWidth - Width of cue tip
     * @param {number} buttWidth - Width of cue butt
     */
    constructor(length, tipWidth, buttWidth) {
        // Cue dimensions
        this.length = length;
        this.tipWidth = tipWidth;
        this.buttWidth = buttWidth;
        
        // Cue state
        this.isAiming = false;      // True when player is aiming
        this.isVisible = false;     // Show/hide cue
        this.angle = 0;             // Angle of cue stick
        this.power = 0.5;           // Shot power (0-1)
        this.maxPower = 0.02;       // Maximum force multiplier
        
        // Position relative to cue ball
        this.offset = 30;           // Distance from cue ball when aiming
        this.pullback = 0;          // How far cue is pulled back
        this.maxPullback = 100;     // Maximum pullback distance
        
        // Aiming assistance
        this.showAimLine = true;    // Show aiming line
        this.aimLineLength = 200;   // Length of aim line
        
        // STEP 5: Professional Cue Ball Contact Point & Spin Physics
        // Professional snooker contact point system for advanced ball control
        this.contactPoint = {
            x: 0,               // Horizontal contact (-1 to 1): -1=left english, 0=center, 1=right english
            y: 0                // Vertical contact (-1 to 1): -1=draw/screw, 0=center, 1=follow/topspin
        };
        
        // Professional spin physics parameters (based on real snooker mechanics)
        this.maxEnglish = 0.8;          // Maximum side spin intensity (professional limit)
        this.maxFollowDraw = 0.9;       // Maximum follow/draw spin intensity
        this.spinSensitivity = 2.5;     // Mouse sensitivity for spin control
        this.contactRadius = 25;        // Visual radius for contact point selection
        
        // Advanced shot techniques
        this.shotType = 'normal';       // normal, stun, power, finesse
        this.spinTransferEfficiency = 0.85;  // How efficiently spin transfers to ball (professional)
        this.englishCurveIntensity = 0.12;   // How much side spin curves the ball path
        
        // Professional spin visualization
        this.showContactPoint = true;   // Show contact point indicator on cue ball
        this.showSpinPreview = true;    // Show spin effect preview
        this.contactPointColor = color(255, 215, 0);  // Gold color for contact point
        
        // Spin effect timing (realistic physics)
        this.spinApplicationDelay = 2;      // Frames delay for spin to take effect (realistic)
        this.spinDecayFactor = 0.992;       // How fast spin decays during rolling
        this.cushionSpinRetention = 0.75;   // How much spin survives cushion bounce
    }
    
    /**
     * Start aiming at the cue ball
     * @param {Ball} cueBall - The cue ball to aim at
     * @param {Array} balls - Array of all balls to check movement
     */
    startAiming(cueBall, balls) {
        if (cueBall && !cueBall.isPocketed && !this.isAnyBallMoving(balls)) {
            this.isAiming = true;
            this.isVisible = true;
            this.pullback = 0;
        }
    }
    
    /**
     * Stop aiming
     */
    stopAiming() {
        this.isAiming = false;
        this.pullback = 0;
    }
    
    /**
     * Update cue angle based on mouse position
     * @param {Ball} cueBall - The cue ball
     * @param {number} mouseX - Mouse X position
     * @param {number} mouseY - Mouse Y position
     */
    updateAngle(cueBall, mouseX, mouseY) {
        if (cueBall && !cueBall.isPocketed) {
            const pos = cueBall.body.position;
            // Calculate angle from cue ball to mouse
            this.angle = atan2(mouseY - pos.y, mouseX - pos.x);
        }
    }
    
    /**
     * Update pullback based on mouse drag
     * @param {Ball} cueBall - The cue ball
     * @param {number} mouseX - Mouse X position
     * @param {number} mouseY - Mouse Y position
     */
    updatePullback(cueBall, mouseX, mouseY) {
        if (this.isAiming && cueBall && !cueBall.isPocketed) {
            const pos = cueBall.body.position;
            // Calculate distance from mouse to cue ball
            const distance = dist(mouseX, mouseY, pos.x, pos.y);
            
            // Set pullback based on distance (clamped to max)
            this.pullback = constrain(distance - this.offset, 0, this.maxPullback);
        }
    }
    
    /**
     * Adjust power with keyboard
     * @param {number} delta - Power change (-1 or 1)
     */
    adjustPower(delta) {
        this.power = constrain(this.power + delta * 0.1, 0.1, 1);
    }
    
    /**
     * STEP 5: Professional Cue Ball Contact Point Control
     * Set contact point on cue ball based on mouse position for spin control
     * @param {Ball} cueBall - The cue ball
     * @param {number} mouseX - Mouse X position
     * @param {number} mouseY - Mouse Y position
     */
    setContactPoint(cueBall, mouseX, mouseY) {
        if (cueBall && !cueBall.isPocketed) {
            const pos = cueBall.body.position;
            
            // Calculate relative position on cue ball (-1 to 1 for both axes)
            const relativeX = (mouseX - pos.x) / this.contactRadius;
            const relativeY = (mouseY - pos.y) / this.contactRadius;
            
            // Clamp to maximum contact point limits (professional constraints)
            this.contactPoint.x = constrain(relativeX, -this.maxEnglish, this.maxEnglish);
            this.contactPoint.y = constrain(relativeY, -this.maxFollowDraw, this.maxFollowDraw);
            
            // Determine shot type based on contact point
            this.determineShotType();
        }
    }
    
    /**
     * Determine professional shot type based on contact point
     */
    determineShotType() {
        const absX = Math.abs(this.contactPoint.x);
        const absY = Math.abs(this.contactPoint.y);
        
        if (absX < 0.1 && absY < 0.1) {
            this.shotType = 'stun';      // Center contact - stun shot
        } else if (absY > 0.6) {
            this.shotType = this.contactPoint.y > 0 ? 'follow' : 'draw';
        } else if (absX > 0.5) {
            this.shotType = 'english';   // Side spin shot
        } else {
            this.shotType = 'normal';    // Standard shot
        }
    }
    
    /**
     * STEP 5: Professional Spin Application & Shot Execution
     * Apply professional spin physics and force to cue ball
     * @param {Ball} cueBall - The cue ball to hit
     */
    shoot(cueBall) {
        if (this.isAiming && cueBall && !cueBall.isPocketed && this.pullback > 10) {
            // Calculate base force based on pullback and power
            const forceMagnitude = (this.pullback / this.maxPullback) * this.power * this.maxPower;
            
            // Base force direction
            const baseForceX = cos(this.angle) * forceMagnitude;
            const baseForceY = sin(this.angle) * forceMagnitude;
            
            // PROFESSIONAL SPIN PHYSICS APPLICATION
            // Apply force to cue ball with professional spin characteristics
            this.applyProfessionalSpin(cueBall, baseForceX, baseForceY);
            
            // Professional shot feedback message
            this.displayShotFeedback();
            
            // Reset cue state
            this.stopAiming();
            this.isVisible = false;
        }
    }
    
    /**
     * Apply professional spin physics to cue ball
     * @param {Ball} cueBall - The cue ball
     * @param {number} baseForceX - Base force X component
     * @param {number} baseForceY - Base force Y component
     */
    applyProfessionalSpin(cueBall, baseForceX, baseForceY) {
        // Apply base linear force
        cueBall.applyForce(baseForceX, baseForceY);
        
        // Calculate professional spin components
        const horizontalSpin = this.contactPoint.x * this.spinTransferEfficiency;
        const verticalSpin = this.contactPoint.y * this.spinTransferEfficiency;
        
        // Apply angular velocity for spin (professional physics)
        const spinIntensity = Math.sqrt(baseForceX * baseForceX + baseForceY * baseForceY) * 200;
        
        // Horizontal spin (English) - affects ball curve
        const englishSpin = horizontalSpin * spinIntensity;
        
        // Vertical spin affects follow/draw behavior after collision
        const followDrawSpin = verticalSpin * spinIntensity;
        
        // Apply combined spin to ball
        const totalSpin = englishSpin + (followDrawSpin * 0.6); // Follow/draw has less immediate effect
        Matter.Body.setAngularVelocity(cueBall.body, totalSpin);
        
        // Store spin information in cue ball for professional collision handling
        cueBall.applySpinData({
            english: horizontalSpin,
            followDraw: verticalSpin,
            intensity: spinIntensity,
            shotType: this.shotType
        });
        
        // Apply english curve effect (delayed application for realism)
        if (Math.abs(horizontalSpin) > 0.1) {
            setTimeout(() => {
                this.applyEnglishCurve(cueBall, horizontalSpin, baseForceX, baseForceY);
            }, this.spinApplicationDelay * 16.67); // Convert frames to milliseconds
        }
    }
    
    /**
     * Apply english (side spin) curve effect to cue ball
     * @param {Ball} cueBall - The cue ball
     * @param {number} englishAmount - Amount of english (-1 to 1)
     * @param {number} baseForceX - Original force X
     * @param {number} baseForceY - Original force Y
     */
    applyEnglishCurve(cueBall, englishAmount, baseForceX, baseForceY) {
        if (cueBall && cueBall.body && !cueBall.isPocketed) {
            // Calculate perpendicular force for curve effect
            const perpendicularAngle = this.angle + (Math.PI / 2);
            const curveForce = englishAmount * this.englishCurveIntensity * 0.001;
            
            const curveX = cos(perpendicularAngle) * curveForce;
            const curveY = sin(perpendicularAngle) * curveForce;
            
            // Apply gradual curve force
            cueBall.applyForce(curveX, curveY);
        }
    }
    
    /**
     * Display professional shot feedback message
     */
    displayShotFeedback() {
        let message = "";
        const spinStrength = Math.sqrt(this.contactPoint.x * this.contactPoint.x + this.contactPoint.y * this.contactPoint.y);
        
        switch(this.shotType) {
            case 'stun':
                message = "🎯 STUN SHOT - Center contact for precise positioning";
                break;
            case 'follow':
                message = `🔄 FOLLOW SHOT - Top spin (${Math.round(this.contactPoint.y * 100)}%)`;
                break;
            case 'draw':
                message = `⬅️ DRAW/SCREW SHOT - Bottom spin (${Math.round(Math.abs(this.contactPoint.y) * 100)}%)`;
                break;
            case 'english':
                const side = this.contactPoint.x > 0 ? "RIGHT" : "LEFT";
                message = `🌀 ${side} ENGLISH - Side spin (${Math.round(Math.abs(this.contactPoint.x) * 100)}%)`;
                break;
            default:
                if (spinStrength > 0.2) {
                    message = `⚡ COMBINATION SHOT - English: ${Math.round(this.contactPoint.x * 100)}%, Vertical: ${Math.round(this.contactPoint.y * 100)}%`;
                } else {
                    message = "🎱 STANDARD SHOT - Center contact";
                }
        }
        
        // Show message in game (assuming showMessage function exists)
        if (typeof showMessage === 'function') {
            showMessage(message, 3000);
        }
    }
    
    /**
     * Display the cue stick
     * @param {Ball} cueBall - The cue ball (for positioning)
     */
    show(cueBall) {
        // Always show cue when called with valid cueBall
        if (cueBall && !cueBall.isPocketed) {
            this.isVisible = true;
            const pos = cueBall.body.position;
            
            // Calculate cue position with smooth animation
            const cueDistance = this.offset + cueBall.radius + this.pullback;
            const cueX = pos.x - cos(this.angle) * cueDistance;
            const cueY = pos.y - sin(this.angle) * cueDistance;
            const cueEndX = cueX - cos(this.angle) * this.length;
            const cueEndY = cueY - sin(this.angle) * this.length;
            
            push(); // Save drawing state
            
            // Draw cue shadow for depth
            push();
            drawingContext.shadowColor = 'rgba(0, 0, 0, 0.3)';
            drawingContext.shadowBlur = 8;
            drawingContext.shadowOffsetX = 3;
            drawingContext.shadowOffsetY = 3;
            
            // Draw main cue shaft
            strokeWeight(this.buttWidth);
            strokeCap(ROUND);
            
            // Create gradient for cue shaft
            const gradient = drawingContext.createLinearGradient(cueX, cueY, cueEndX, cueEndY);
            gradient.addColorStop(0, '#8B4513'); // Saddle brown at tip
            gradient.addColorStop(0.3, '#A0522D'); // Sienna
            gradient.addColorStop(0.7, '#CD853F'); // Peru
            gradient.addColorStop(1, '#D2691E'); // Chocolate at butt
            drawingContext.strokeStyle = gradient;
            
            line(cueX, cueY, cueEndX, cueEndY);
            pop();
            
            // Draw ferrule (white band before tip)
            push();
            stroke(255, 255, 255);
            strokeWeight(this.tipWidth + 2);
            const ferruleStart = 0.15; // 15% from tip
            const ferruleX1 = cueX - cos(this.angle) * (this.length * ferruleStart);
            const ferruleY1 = cueY - sin(this.angle) * (this.length * ferruleStart);
            const ferruleX2 = cueX - cos(this.angle) * (this.length * (ferruleStart + 0.05));
            const ferruleY2 = cueY - sin(this.angle) * (this.length * (ferruleStart + 0.05));
            line(ferruleX1, ferruleY1, ferruleX2, ferruleY2);
            pop();
            
            // Draw cue tip (blue chalk)
            push();
            stroke(100, 149, 237); // Cornflower blue
            strokeWeight(this.tipWidth);
            strokeCap(ROUND);
            const tipEndX = cueX - cos(this.angle) * 10;
            const tipEndY = cueY - sin(this.angle) * 10;
            line(cueX, cueY, tipEndX, tipEndY);
            pop();
            
            // Draw decorative rings
            push();
            stroke(255, 215, 0); // Gold
            strokeWeight(2);
            for (let i = 0.6; i <= 0.8; i += 0.1) {
                const ringX = cueX - cos(this.angle) * (this.length * i);
                const ringY = cueY - sin(this.angle) * (this.length * i);
                push();
                translate(ringX, ringY);
                rotate(this.angle + PI/2);
                line(-this.buttWidth/2, 0, this.buttWidth/2, 0);
                pop();
            }
            pop();
            
            pop(); // Restore drawing state
            
            // STEP 5: Professional Aiming System with Spin Visualization
            if (this.showAimLine && this.isAiming) {
                push();
                
                // Enhanced dotted aiming line with spin curve preview
                const dotCount = 25;
                const dotSpacing = 12;
                const dotSize = 2.5;
                
                for (let i = 1; i <= dotCount; i++) {
                    const distance = i * dotSpacing;
                    let dotX = pos.x + cos(this.angle) * distance;
                    let dotY = pos.y + sin(this.angle) * distance;
                    
                    // Apply english curve visualization to dots
                    if (Math.abs(this.contactPoint.x) > 0.1 && i > 5) {
                        const curveStrength = this.contactPoint.x * this.englishCurveIntensity * (i - 5);
                        const perpendicularAngle = this.angle + (Math.PI / 2);
                        dotX += cos(perpendicularAngle) * curveStrength * 15;
                        dotY += sin(perpendicularAngle) * curveStrength * 15;
                    }
                    
                    // Professional gradient coloring based on spin type
                    let dotColor = [255, 255, 255];
                    if (this.shotType === 'english') {
                        dotColor = this.contactPoint.x > 0 ? [255, 100, 100] : [100, 100, 255]; // Red/Blue for english
                    } else if (this.shotType === 'follow') {
                        dotColor = [100, 255, 100]; // Green for follow
                    } else if (this.shotType === 'draw') {
                        dotColor = [255, 255, 100]; // Yellow for draw
                    }
                    
                    // Fade dots based on distance
                    const alpha = map(i, 0, dotCount, 200, 30);
                    fill(dotColor[0], dotColor[1], dotColor[2], alpha);
                    noStroke();
                    
                    // Make dots smaller as they get farther
                    const size = map(i, 0, dotCount, dotSize, dotSize * 0.3);
                    circle(dotX, dotY, size);
                }
                
                // Professional trajectory line with spin indication
                if (Math.abs(this.contactPoint.x) > 0.1) {
                    // Curved line for english shots
                    stroke(255, 165, 0, 60); // Orange for curve
                    strokeWeight(2);
                    noFill();
                    beginShape();
                    for (let i = 0; i <= 20; i++) {
                        const t = i / 20;
                        const distance = t * 300;
                        let x = pos.x + cos(this.angle) * distance;
                        let y = pos.y + sin(this.angle) * distance;
                        
                        // Apply curve
                        const curveStrength = this.contactPoint.x * this.englishCurveIntensity * distance * 0.3;
                        const perpendicularAngle = this.angle + (Math.PI / 2);
                        x += cos(perpendicularAngle) * curveStrength;
                        y += sin(perpendicularAngle) * curveStrength;
                        
                        vertex(x, y);
                    }
                    endShape();
                } else {
                    // Straight line for center shots
                    stroke(255, 255, 255, 40);
                    strokeWeight(1);
                    const lineEndX = pos.x + cos(this.angle) * 350;
                    const lineEndY = pos.y + sin(this.angle) * 350;
                    line(pos.x, pos.y, lineEndX, lineEndY);
                }
                
                pop();
            }
            
            // STEP 5: Professional Contact Point Visualization on Cue Ball
            if (this.showContactPoint && this.isAiming) {
                push();
                
                // Draw contact point selection area
                stroke(this.contactPointColor);
                strokeWeight(2);
                noFill();
                circle(pos.x, pos.y, this.contactRadius * 2);
                
                // Draw crosshairs for precise aiming
                stroke(255, 255, 255, 100);
                strokeWeight(1);
                line(pos.x - this.contactRadius, pos.y, pos.x + this.contactRadius, pos.y);
                line(pos.x, pos.y - this.contactRadius, pos.x, pos.y + this.contactRadius);
                
                // Draw current contact point
                const contactX = pos.x + this.contactPoint.x * this.contactRadius;
                const contactY = pos.y + this.contactPoint.y * this.contactRadius;
                
                // Contact point indicator with professional styling
                fill(this.contactPointColor);
                stroke(0, 0, 0, 150);
                strokeWeight(2);
                circle(contactX, contactY, 8);
                
                // Spin direction indicators
                if (Math.abs(this.contactPoint.x) > 0.1 || Math.abs(this.contactPoint.y) > 0.1) {
                    // Draw spin arrows
                    stroke(this.contactPointColor);
                    strokeWeight(3);
                    
                    // English arrows (horizontal)
                    if (Math.abs(this.contactPoint.x) > 0.1) {
                        const arrowSize = 12;
                        const arrowX = pos.x + (this.contactPoint.x > 0 ? this.contactRadius + 15 : -this.contactRadius - 15);
                        
                        // Arrow shaft
                        line(arrowX - arrowSize, pos.y, arrowX + arrowSize, pos.y);
                        
                        // Arrow head
                        if (this.contactPoint.x > 0) {
                            line(arrowX + arrowSize, pos.y, arrowX + arrowSize - 6, pos.y - 4);
                            line(arrowX + arrowSize, pos.y, arrowX + arrowSize - 6, pos.y + 4);
                        } else {
                            line(arrowX - arrowSize, pos.y, arrowX - arrowSize + 6, pos.y - 4);
                            line(arrowX - arrowSize, pos.y, arrowX - arrowSize + 6, pos.y + 4);
                        }
                    }
                    
                    // Follow/Draw arrows (vertical)
                    if (Math.abs(this.contactPoint.y) > 0.1) {
                        const arrowSize = 12;
                        const arrowY = pos.y + (this.contactPoint.y > 0 ? this.contactRadius + 15 : -this.contactRadius - 15);
                        
                        // Arrow shaft
                        line(pos.x, arrowY - arrowSize, pos.x, arrowY + arrowSize);
                        
                        // Arrow head
                        if (this.contactPoint.y > 0) {
                            line(pos.x, arrowY + arrowSize, pos.x - 4, arrowY + arrowSize - 6);
                            line(pos.x, arrowY + arrowSize, pos.x + 4, arrowY + arrowSize - 6);
                        } else {
                            line(pos.x, arrowY - arrowSize, pos.x - 4, arrowY - arrowSize + 6);
                            line(pos.x, arrowY - arrowSize, pos.x + 4, arrowY - arrowSize + 6);
                        }
                    }
                }
                
                // Professional shot type indicator
                fill(255, 255, 255, 200);
                stroke(0, 0, 0, 100);
                strokeWeight(1);
                textAlign(CENTER, CENTER);
                textSize(10);
                textStyle(BOLD);
                
                let typeText = "";
                let typeColor = color(255, 255, 255);
                
                switch(this.shotType) {
                    case 'stun':
                        typeText = "STUN";
                        typeColor = color(255, 255, 255);
                        break;
                    case 'follow':
                        typeText = "FOLLOW";
                        typeColor = color(100, 255, 100);
                        break;
                    case 'draw':
                        typeText = "DRAW";
                        typeColor = color(255, 255, 100);
                        break;
                    case 'english':
                        typeText = this.contactPoint.x > 0 ? "R-ENGLISH" : "L-ENGLISH";
                        typeColor = this.contactPoint.x > 0 ? color(255, 100, 100) : color(100, 100, 255);
                        break;
                    default:
                        typeText = "NORMAL";
                        typeColor = color(255, 255, 255);
                }
                
                fill(typeColor);
                text(typeText, pos.x, pos.y - this.contactRadius - 25);
                
                pop();
            }
            
            // Power indicator (enhanced)
            if (this.isAiming) {
                // Draw power bar with better styling
                push();
                resetMatrix(); // Reset to screen coordinates
                translate(width/2, height - 80);
                
                // Background with rounded corners
                fill(0, 0, 0, 180);
                stroke(255, 255, 255, 100);
                strokeWeight(2);
                rect(-102, -22, 204, 44, 10);
                
                // Power gradient bar
                noStroke();
                const gradient = drawingContext.createLinearGradient(-100, 0, 100, 0);
                gradient.addColorStop(0, 'rgba(0, 255, 0, 0.8)');
                gradient.addColorStop(0.5, 'rgba(255, 255, 0, 0.8)');
                gradient.addColorStop(1, 'rgba(255, 0, 0, 0.8)');
                drawingContext.fillStyle = gradient;
                drawingContext.fillRect(-100, -20, 200 * this.power, 40);
                
                // Power level indicator
                stroke(255);
                strokeWeight(3);
                const powerX = -100 + 200 * this.power;
                line(powerX, -20, powerX, 20);
                
                // Power text
                fill(255);
                noStroke();
                textAlign(CENTER, CENTER);
                textSize(16);
                textStyle(BOLD);
                text('POWER: ' + Math.round(this.power * 100) + '%', 0, 0);
                
                pop();
            }
        }
    }
    
    /**
     * Check if any ball is still moving
     * @param {Array} balls - Array of all balls to check
     * @returns {boolean} - True if any ball is moving
     */
    isAnyBallMoving(balls) {
        if (!balls) return false;
        
        // Check if any ball is moving
        return balls.some(ball => {
            if (ball.isPocketed) return false;
            const vel = ball.body.velocity;
            const speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y);
            return speed > 0.1;
        });
    }
    
    /**
     * Hide the cue
     */
    hide() {
        this.isVisible = false;
        this.isAiming = false;
        this.pullback = 0;
    }
    
    /**
     * Make the cue visible (but not aiming yet)
     */
    makeVisible() {
        this.isVisible = true;
    }
} 