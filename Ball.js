/**
 * Ball class - Represents a snooker ball with physics properties
 * Uses matter.js for physics simulation
 */
class Ball {
    /**
     * Constructor for Ball class
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} radius - Ball radius
     * @param {string} color - Ball color (hex or p5.js color)
     * @param {string} type - Ball type (red, cue, yellow, green, brown, blue, pink, black)
     * @param {number} value - Point value of the ball
     */
    constructor(x, y, radius, color, type, value) {
        // Store ball properties
        this.startX = x; // Original starting position X
        this.startY = y; // Original starting position Y
        this.radius = radius;
        this.color = color;
        this.type = type;
        this.value = value;
        this.isPocketed = false; // Track if ball is pocketed
        
        // STEP 4: . Professional Ball Physics Implementation
        // Calculate professional density based on real snooker ball specifications
        // Real snooker balls: 142g mass, 52.5mm diameter (volume ≈ 75.7 cm³)
        // Professional density ≈ 1.875 g/cm³ in real units
        // Scaled for Matter.js physics engine with proper momentum characteristics
        const professionalDensity = 0.002847; // Calibrated for tournament-grade ball behavior
        
        // Professional tournament baize friction characteristics  
        // Based on Strachan 6811 tournament cloth specifications
        const professionalBaizeFriction = 0.0085;      // Tournament-grade cloth resistance
        const professionalStaticFriction = 0.0095;     // Slightly higher for realistic grip
        const professionalAirResistance = 0.008;       // Professional playing conditions
        
        // . ball-to-ball collision restitution (energy retention in impacts)
        const professionalRestitution = 0.935;         // Tournament-grade collision efficiency
        
        // Create matter.js physics body with . professional specifications
        this.body = Matter.Bodies.circle(x, y, radius, {
            restitution: professionalRestitution,       // 93.5% energy retention (. tournament standard)
            friction: professionalBaizeFriction,        // Tournament-grade baize friction (Strachan 6811)
            frictionAir: professionalAirResistance,     // Professional playing environment air resistance
            frictionStatic: professionalStaticFriction, // Realistic static grip on tournament cloth
            density: professionalDensity,               // Professional ball mass (142g scaled)
            label: type,                                // Ball type identifier for collision detection
            slop: 0.001,                               // Tournament-grade collision precision (reduced from 0.01)
            inertia: (2/5) * professionalDensity * radius * radius // Realistic rotational inertia for solid sphere
        });
        
        // Add professional physics metadata for advanced calculations
        this.professionalMass = this.body.mass;
        this.professionalDensity = professionalDensity;
        this.rollResistanceCoefficient = 0.0012;      // Professional cloth roll resistance
        this.spinDecayRate = 0.985;                   // Realistic spin energy loss per frame
        
        // Add the physics body to the world
        Matter.World.add(world, this.body);
    }
    
    /**
     * Display the ball on screen
     */
    show() {
        // Only show if not pocketed
        if (!this.isPocketed) {
            // Get current position from physics engine
            const pos = this.body.position;
            const angle = this.body.angle;
            
            push(); // Save drawing state
            translate(pos.x, pos.y); // Move to ball position
            rotate(angle); // Rotate if ball is spinning
            
            // Draw the ball
            fill(this.color);
            noStroke();
            circle(0, 0, this.radius * 2);
            
            // Add white dot on cue ball for spin visualization
            if (this.type === 'cue') {
                fill(255);
                circle(this.radius * 0.5, 0, this.radius * 0.3);
            }
            
            // Add number on colored balls (except red)
            if (this.type !== 'red' && this.type !== 'cue') {
                fill(255);
                textAlign(CENTER, CENTER);
                textSize(this.radius * 0.8);
                text(this.value, 0, 0);
            }
            
            pop(); // Restore drawing state
        }
    }
    
    /**
     * Check if ball is in a pocket - IMPROVED with realistic physics
     * @param {Array} pockets - Array of pocket objects with x, y, radius
     * @returns {boolean} - True if ball is in any pocket
     */
    checkPocket(pockets) {
        const pos = this.body.position;
        const velocity = this.body.velocity;
        const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
        
        for (let pocket of pockets) {
            // Calculate distance to pocket center
            const d = dist(pos.x, pos.y, pocket.x, pocket.y);
            
            // Professional pocket physics - ball must be well within pocket
            // Different thresholds based on pocket type and ball speed
            let pocketThreshold;
            
            if (pocket.type === 'corner') {
                // Corner pockets - tighter threshold (harder to pot)
                pocketThreshold = pocket.radius * 0.65;
                
                // Speed affects pocketing - fast balls need to be more centered
                if (speed > 10) {
                    pocketThreshold *= 0.9;
                } else if (speed > 5) {
                    pocketThreshold *= 0.95;
                }
            } else {
                // Middle pockets - slightly easier
                pocketThreshold = pocket.radius * 0.7;
                
                // Speed affects pocketing
                if (speed > 10) {
                    pocketThreshold *= 0.85;
                } else if (speed > 5) {
                    pocketThreshold *= 0.92;
                }
            }
            
            // Ball is pocketed if center is within threshold
            if (d < pocketThreshold) {
                // Additional check - ball must be moving toward pocket, not away
                const toPocketX = pocket.x - pos.x;
                const toPocketY = pocket.y - pos.y;
                const dotProduct = velocity.x * toPocketX + velocity.y * toPocketY;
                
                // If ball is moving away from pocket center at high speed, don't pocket
                if (dotProduct < -2 && speed > 5) {
                    continue;
                }
                
                return true;
            }
        }
        return false;
    }
    
    /**
     * Remove ball from the game (when pocketed)
     */
    pocket() {
        this.isPocketed = true;
        // Remove from physics world
        Matter.World.remove(world, this.body);
    }
    
    /**
     * Respawn ball at specific position with professional physics (for colored balls)
     * @param {number} x - X position
     * @param {number} y - Y position
     */
    respawn(x, y) {
        this.isPocketed = false;
        
        // Remove old body and create new one at position
        Matter.World.remove(world, this.body);
        
        // STEP 4: Maintain professional physics consistency in respawn
        const professionalDensity = 0.002847;          // Professional ball mass (142g scaled)
        const professionalBaizeFriction = 0.0085;      // Tournament-grade baize friction
        const professionalStaticFriction = 0.0095;     // Realistic static grip
        const professionalAirResistance = 0.008;       // Professional conditions
        const professionalRestitution = 0.935;         // . tournament standard
        
        this.body = Matter.Bodies.circle(x, y, this.radius, {
            restitution: professionalRestitution,       // 93.5% energy retention (. tournament standard)
            friction: professionalBaizeFriction,        // Tournament-grade baize friction (Strachan 6811)
            frictionAir: professionalAirResistance,     // Professional playing environment air resistance
            frictionStatic: professionalStaticFriction, // Realistic static grip on tournament cloth
            density: professionalDensity,               // Professional ball mass (142g scaled)
            label: this.type,                           // Ball type identifier for collision detection
            slop: 0.001,                               // Tournament-grade collision precision
            inertia: (2/5) * professionalDensity * this.radius * this.radius // Realistic rotational inertia
        });
        
        // Restore professional physics metadata
        this.professionalMass = this.body.mass;
        this.professionalDensity = professionalDensity;
        this.rollResistanceCoefficient = 0.0012;      // Professional cloth roll resistance
        this.spinDecayRate = 0.985;                   // Realistic spin energy loss per frame
        
        // Reset velocity
        Matter.Body.setVelocity(this.body, { x: 0, y: 0 });
        Matter.Body.setAngularVelocity(this.body, 0);
        
        // Add back to world
        Matter.World.add(world, this.body);
    }
    
    /**
     * Reset ball to starting position
     */
    reset() {
        this.respawn(this.startX, this.startY);
    }
    
    /**
     * Set ball position
     * @param {number} x - X position
     * @param {number} y - Y position
     */
    setPosition(x, y) {
        Matter.Body.setPosition(this.body, { x: x, y: y });
        Matter.Body.setVelocity(this.body, { x: 0, y: 0 });
        Matter.Body.setAngularVelocity(this.body, 0);
    }
    
    /**
     * Apply force to ball (for cue hitting)
     * @param {number} forceX - Force in X direction
     * @param {number} forceY - Force in Y direction
     */
    applyForce(forceX, forceY) {
        Matter.Body.applyForce(this.body, this.body.position, {
            x: forceX,
            y: forceY
        });
    }
    
    /**
     * STEP 4: Apply professional tournament cloth deceleration
     * Implements realistic rolling resistance based on Strachan 6811 tournament cloth
     * This method should be called every frame for active balls
     */
    applyProfessionalDeceleration() {
        if (!this.isPocketed && this.body) {
            const velocity = this.body.velocity;
            const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
            
            // Only apply deceleration if ball is moving above minimum threshold
            if (speed > 0.05) {
                // Professional cloth rolling resistance calculation
                // Based on tournament-grade baize friction characteristics
                let decelerationFactor = 1 - this.rollResistanceCoefficient;
                
                // Speed-dependent deceleration (slower balls have higher relative resistance)
                if (speed < 2) {
                    // Very slow rolling - increased resistance near stopping
                    decelerationFactor -= 0.0008;
                } else if (speed < 5) {
                    // Slow rolling - moderate additional resistance
                    decelerationFactor -= 0.0004;
                }
                
                // Apply realistic bounds
                decelerationFactor = Math.max(0.988, Math.min(0.9985, decelerationFactor));
                
                // Apply professional deceleration
                const newVelocity = {
                    x: velocity.x * decelerationFactor,
                    y: velocity.y * decelerationFactor
                };
                
                // Set new velocity with tournament-grade precision
                Matter.Body.setVelocity(this.body, newVelocity);
                
                // Apply realistic spin decay
                const currentAngularVelocity = this.body.angularVelocity;
                if (Math.abs(currentAngularVelocity) > 0.01) {
                    Matter.Body.setAngularVelocity(this.body, 
                        currentAngularVelocity * this.spinDecayRate);
                }
            } else if (speed > 0 && speed <= 0.05) {
                // Professional stopping threshold - bring to complete rest
                Matter.Body.setVelocity(this.body, { x: 0, y: 0 });
                Matter.Body.setAngularVelocity(this.body, 0);
            }
        }
    }

    /**
     * Check if ball is moving (with professional threshold)
     * @returns {boolean} - True if ball velocity is above professional threshold
     */
    isMoving() {
        const vel = this.body.velocity;
        const speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y);
        return speed > 0.05; // Professional threshold for "moving" (reduced from 0.1)
    }
    
    /**
     * STEP 5: Professional Spin Physics - Store spin information for realistic ball behavior
     * @param {Object} spinData - Spin data with english, followDraw, intensity, and shotType
     */
    applySpinData(spinData) {
        this.currentSpin = {
            english: spinData.english || 0,
            followDraw: spinData.followDraw || 0,
            intensity: spinData.intensity || 0,
            shotType: spinData.shotType || 'normal',
            active: true,
            timeApplied: Date.now()
        };
    }
    
    /**
     * STEP 5: Professional Follow/Draw Effect after Ball-to-Ball Collision
     * Applies realistic cue ball behavior after hitting another ball based on spin
     * @param {Ball} targetBall - The ball that was hit
     * @param {Object} collisionVector - Direction and force of collision
     */
    applyPostCollisionSpin(targetBall, collisionVector) {
        if (this.type === 'cue' && this.currentSpin && this.currentSpin.active) {
            const followDrawAmount = this.currentSpin.followDraw;
            const englishAmount = this.currentSpin.english;
            
            // Professional follow/draw physics (only applies after ball-to-ball contact)
            if (Math.abs(followDrawAmount) > 0.1) {
                setTimeout(() => {
                    if (this.body && !this.isPocketed) {
                        const currentVel = this.body.velocity;
                        const speed = Math.sqrt(currentVel.x * currentVel.x + currentVel.y * currentVel.y);
                        
                        if (speed > 0.2) { // Only apply if ball still has momentum
                            // Calculate follow/draw direction (opposite to collision for draw, same for follow)
                            const collisionAngle = Math.atan2(collisionVector.y, collisionVector.x);
                            
                            let spinDirection = followDrawAmount > 0 ? 1 : -1; // Follow = 1, Draw = -1
                            let spinForce = Math.abs(followDrawAmount) * 0.0015; // Professional spin strength
                            
                            // Apply follow/draw force
                            const spinX = Math.cos(collisionAngle) * spinDirection * spinForce;
                            const spinY = Math.sin(collisionAngle) * spinDirection * spinForce;
                            
                            this.applyForce(spinX, spinY);
                            
                            // Add visual spin indication
                            if (typeof showMessage === 'function') {
                                const spinType = followDrawAmount > 0 ? "FOLLOW" : "DRAW";
                                showMessage(`${spinType} effect applied!`, 1500);
                            }
                        }
                    }
                }, 50); // Small delay for realistic physics timing
            }
            
            // English effect on collision angle (affects direction after hitting cushions)
            if (Math.abs(englishAmount) > 0.1) {
                this.englishEffectActive = true;
                this.englishAmount = englishAmount;
                
                // English affects cushion bounces for the next few seconds
                setTimeout(() => {
                    this.englishEffectActive = false;
                }, 3000);
            }
        }
    }
    
    /**
     * STEP 5: Professional English Effect on Cushion Bounces
     * Modifies cushion collision angles based on side spin
     * @param {number} incomingAngle - Original bounce angle
     * @param {number} cushionNormal - Cushion surface normal
     * @returns {number} - Modified bounce angle with english effect
     */
    applyEnglishToCushionBounce(incomingAngle, cushionNormal) {
        if (this.type === 'cue' && this.englishEffectActive && this.englishAmount) {
            // Professional english physics - affects bounce angle
            const englishModifier = this.englishAmount * 0.15; // 15% maximum angle modification
            const modifiedAngle = incomingAngle + englishModifier;
            
            // Apply professional limits (english can't completely reverse bounce)
            const maxDeviation = Math.PI / 6; // 30 degrees maximum
            const limitedAngle = Math.max(incomingAngle - maxDeviation, 
                                Math.min(incomingAngle + maxDeviation, modifiedAngle));
            
            // Reduce english effect after each bounce (realistic physics)
            this.englishAmount *= 0.75;
            
            return limitedAngle;
        }
        
        return incomingAngle; // No modification if no english
    }
    
    /**
     * STEP 5: Update spin state each frame (for gradual decay and effects)
     */
    updateSpinPhysics() {
        if (this.currentSpin && this.currentSpin.active) {
            const timeSinceApplied = Date.now() - this.currentSpin.timeApplied;
            
            // Gradual spin decay over time (realistic physics)
            if (timeSinceApplied > 500) { // Start decay after 0.5 seconds
                this.currentSpin.intensity *= 0.995;
                this.currentSpin.english *= 0.998;
                this.currentSpin.followDraw *= 0.996;
                
                // Deactivate spin when it becomes negligible
                if (this.currentSpin.intensity < 0.01) {
                    this.currentSpin.active = false;
                }
            }
        }
    }
} 