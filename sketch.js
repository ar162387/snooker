/**
 * Snooker Game - Main Sketch
 * This file handles the game setup, physics engine, game states, and user interactions
 */

// Matter.js modules
const Engine = Matter.Engine;
const World = Matter.World;
const Bodies = Matter.Bodies;
const Events = Matter.Events;

// Global variables for Matter.js
let engine;
let world;

// Game objects
let table;
let cue;
let balls = [];
let redBalls = [];
let coloredBalls = [];
let cueBall = null;

// Game state
let gameMode = 0; // 0: no balls, 1: starting position, 2: random reds, 3: random all
let cueBallPlaced = false;
let placingCueBall = false;
let lastPottedBalls = []; // Track last two potted colored balls

// UI Messages
let message = "";
let messageTimer = 0;

/**
 * P5.js Setup function - runs once at start
 */
function setup() {
    // Create canvas in the div
    let canvas = createCanvas(1100, 820);
    canvas.parent('canvas-holder');
    
    // Initialize Matter.js physics engine
    engine = Engine.create();
    world = engine.world;
    
    // Disable gravity for top-down view (snooker table is horizontal)
    engine.world.gravity.y = 0;
    engine.world.gravity.x = 0;
    
    // Configure physics engine for realistic snooker physics
    engine.positionIterations = 12; // Higher precision for accurate cushion bounces
    engine.velocityIterations = 12; // Higher precision for velocity calculations
    engine.constraintIterations = 3; // Better constraint resolution
    
    // Improved physics timing for smoother collisions
    engine.timing.timeScale = 1.0; // Normal time scale
    
    // Enhanced collision detection
    engine.detector = Matter.Detector.create();
    engine.broadphase = Matter.Grid.create();
    
    // Set up collision pairs for better restitution
    engine.pairs.collisionStart = [];
    engine.pairs.collisionActive = [];
    engine.pairs.collisionEnd = [];
    
    // Create snooker table (centered in canvas)
    table = new SnookerTable(width/2, height/2, 400);
    
    // Create cue stick
    cue = new Cue(150, 6, 12);
    
    // Initialize balls arrays
    initializeBalls();
    
    // Setup collision detection
    setupCollisionDetection();
    
    // Display detailed geometry information in console
    table.displayGeometryInfo();
    
    // Start with mode 0 (no balls)
    showMessage("Press 1, 2, or 3 to set up the table");
}

/**
 * P5.js Draw function - runs continuously
 */
function draw() {
    background(52, 73, 94); // Dark blue-gray background
    
    // Update physics engine
    Engine.update(engine, 1000/60); // 60 FPS
    
    // STEP 4 & 5: Apply professional ball physics and spin effects
    // Tournament-grade rolling resistance, realistic stopping, and professional spin physics
    balls.forEach(ball => {
        if (!ball.isPocketed && ball.body) {
            // Apply professional deceleration (Step 4)
            if (ball.applyProfessionalDeceleration) {
                ball.applyProfessionalDeceleration();
            }
            
            // Apply professional spin physics updates (Step 5)
            if (ball.updateSpinPhysics) {
                ball.updateSpinPhysics();
            }
        }
    });
    
    // Draw table
    table.show();
    
    // Check for pocketed balls
    checkPocketedBalls();
    
    // Draw cue BEFORE balls so it appears underneath them
    if (cueBall && cueBallPlaced && !placingCueBall && !isAnyBallMoving()) {
        // Always make sure cue is visible when conditions are met
        cue.isVisible = true;
        
        // Update cue angle to follow mouse for better visual feedback
        if (!cue.isAiming) {
            cue.updateAngle(cueBall, mouseX, mouseY);
        }
        
        cue.show(cueBall);
    }
    
    // Draw balls AFTER cue so they appear on top
    balls.forEach(ball => ball.show());
    
    // Handle cue ball placement
    if (placingCueBall) {
        drawCueBallPlacement();
        // Ensure default cursor during cue ball placement
        cursor(ARROW);
    }
    
    // Always call drawCustomCursor - it has its own logic for when to show
    drawCustomCursor();
    
    // Display messages
    displayMessage();
    
    // Display game info
    displayGameInfo();
}

/**
 * Initialize all balls (but don't place them yet)
 */
function initializeBalls() {
    const radius = table.ballRadius;
    
    // Create red balls (15 total)
    for (let i = 0; i < 15; i++) {
        let ball = new Ball(0, 0, radius, color(220, 20, 60), 'red', 1);
        redBalls.push(ball);
        balls.push(ball);
        // Remove from world initially
        Matter.World.remove(world, ball.body);
    }
    
    // Create colored balls
    // Yellow (2 points)
    let yellow = new Ball(0, 0, radius, color(255, 255, 0), 'yellow', 2);
    coloredBalls.push(yellow);
    balls.push(yellow);
    Matter.World.remove(world, yellow.body);
    
    // Green (3 points)
    let green = new Ball(0, 0, radius, color(0, 128, 0), 'green', 3);
    coloredBalls.push(green);
    balls.push(green);
    Matter.World.remove(world, green.body);
    
    // Brown (4 points)
    let brown = new Ball(0, 0, radius, color(139, 69, 19), 'brown', 4);
    coloredBalls.push(brown);
    balls.push(brown);
    Matter.World.remove(world, brown.body);
    
    // Blue (5 points)
    let blue = new Ball(0, 0, radius, color(0, 0, 255), 'blue', 5);
    coloredBalls.push(blue);
    balls.push(blue);
    Matter.World.remove(world, blue.body);
    
    // Pink (6 points)
    let pink = new Ball(0, 0, radius, color(255, 192, 203), 'pink', 6);
    coloredBalls.push(pink);
    balls.push(pink);
    Matter.World.remove(world, pink.body);
    
    // Black (7 points)
    let black = new Ball(0, 0, radius, color(0, 0, 0), 'black', 7);
    coloredBalls.push(black);
    balls.push(black);
    Matter.World.remove(world, black.body);
    
    // Create cue ball (white)
    cueBall = new Ball(0, 0, radius, color(255, 255, 255), 'cue', 0);
    balls.push(cueBall);
    Matter.World.remove(world, cueBall.body);
}

/**
 * Setup collision detection for realistic cushion physics
 */
function setupCollisionDetection() {
    // Handle collision start events
    Events.on(engine, 'collisionStart', function(event) {
        let pairs = event.pairs;
        
        pairs.forEach(pair => {
            let bodyA = pair.bodyA;
            let bodyB = pair.bodyB;
            
            // Identify ball and cushion in collision
            let ballBody = null;
            let cushionBody = null;
            
            if (bodyA.label === 'cushion') {
                cushionBody = bodyA;
                ballBody = bodyB;
            } else if (bodyB.label === 'cushion') {
                cushionBody = bodyB;
                ballBody = bodyA;
            }
            
            // Handle cushion collisions with improved physics
            if (ballBody && cushionBody) {
                handleCushionCollision(ballBody, cushionBody);
            }
            
            // STEP 5: Professional Spin Physics - Handle cue ball collisions
            if (bodyA.label === 'cue' || bodyB.label === 'cue') {
                let cueBallBody = bodyA.label === 'cue' ? bodyA : bodyB;
                let otherBody = bodyA.label === 'cue' ? bodyB : bodyA;
                
                // Find the actual cue ball object
                let cueBallObject = balls.find(ball => ball.body === cueBallBody);
                let targetBallObject = balls.find(ball => ball.body === otherBody);
                
                // Determine collision type and apply spin effects
                if (otherBody.label === 'cushion') {
                    showMessage("Cue ball hit cushion!");
                    
                    // Apply english effect to cushion bounce if active
                    if (cueBallObject && cueBallObject.englishEffectActive) {
                        // Professional english cushion physics will be handled in cushion collision
                    }
                } else if (targetBallObject) {
                    // Ball-to-ball collision - apply professional spin physics
                    const ballType = otherBody.label;
                    
                    if (ballType === 'red') {
                        showMessage("Cue ball hit red ball!");
                    } else if (['yellow', 'green', 'brown', 'blue', 'pink', 'black'].includes(ballType)) {
                        showMessage(`Cue ball hit ${ballType} ball!`);
                    }
                    
                    // Apply professional follow/draw effect after collision
                    if (cueBallObject && cueBallObject.applyPostCollisionSpin) {
                        // Calculate collision vector for realistic spin application
                        const cueBallPos = cueBallBody.position;
                        const targetPos = otherBody.position;
                        const collisionVector = {
                            x: targetPos.x - cueBallPos.x,
                            y: targetPos.y - cueBallPos.y
                        };
                        
                        // Normalize collision vector
                        const magnitude = Math.sqrt(collisionVector.x * collisionVector.x + collisionVector.y * collisionVector.y);
                        if (magnitude > 0) {
                            collisionVector.x /= magnitude;
                            collisionVector.y /= magnitude;
                        }
                        
                        // Apply professional spin effects after small delay (realistic physics)
                        setTimeout(() => {
                            cueBallObject.applyPostCollisionSpin(targetBallObject, collisionVector);
                        }, 10);
                    }
                }
            }
        });
    });
}

/**
 * STEP 3: Professional . Cushion Collision Physics
 * Implements tournament-grade wooden cushion behavior with speed-dependent energy absorption
 * @param {Matter.Body} ballBody - The ball body
 * @param {Matter.Body} cushionBody - The cushion body
 */
function handleCushionCollision(ballBody, cushionBody) {
    // OPTIMIZED: Minimal additional processing for perfect cushion bouncing
    // The cushion restitution (95%) already handles energy loss properly
    // This function now only ensures perfect angle reflection without additional energy loss
    
    const velocity = ballBody.velocity;
    const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
    
    // Only apply minimal adjustment for very high-speed impacts to prevent unrealistic bouncing
    if (speed > 20) {
        // Slight dampening only for extremely high speeds to maintain realism
        const dampening = 0.98; // Only 2% additional loss for extreme speeds
        
        setTimeout(() => {
            if (ballBody && ballBody.velocity) {
                Matter.Body.setVelocity(ballBody, {
                    x: ballBody.velocity.x * dampening,
                    y: ballBody.velocity.y * dampening
                });
            }
        }, 0.1); // Minimal delay for immediate response
    }
    
    // Note: Primary energy loss (5%) is handled by cushion restitution = 0.95
    // This ensures perfect angle reflection with minimal energy loss as requested
}

/**
 * Set up balls in different modes based on key press
 * @param {number} mode - Game mode (1, 2, or 3)
 */
function setupBallsMode(mode) {
    // Clear all balls first
    clearAllBalls();
    
    gameMode = mode;
    
    // IMPORTANT: Reset cue state when switching modes
    cue.hide(); // Hide the cue
    cue.stopAiming(); // Stop any aiming
    
    switch(mode) {
        case 1: // Starting position
            setupStartingPosition();
            showMessage("Mode 1: Starting position - Click in D zone to place cue ball");
            break;
            
        case 2: // Random reds only
            setupRandomReds();
            showMessage("Mode 2: Random red balls - Click in D zone to place cue ball");
            break;
            
        case 3: // Random all balls
            setupRandomAll();
            showMessage("Mode 3: Random all balls - Click in D zone to place cue ball");
            break;
    }
    
    // Reset cue ball placement state
    cueBallPlaced = false;
    placingCueBall = true;
    
    // Ensure default cursor is shown when placing cue ball
    cursor(ARROW);
}

/**
 * Clear all balls from the table
 */
function clearAllBalls() {
    balls.forEach(ball => {
        if (!ball.isPocketed) {
            Matter.World.remove(world, ball.body);
        }
        ball.isPocketed = false;
    });
}

/**
 * Setup mode 1: Starting position
 */
function setupStartingPosition() {
    // Place red balls in triangle
    const redPositions = table.getRedBallPositions();
    redBalls.forEach((ball, i) => {
        ball.respawn(redPositions[i].x, redPositions[i].y);
    });
    
    // Place colored balls on their spots
    coloredBalls.forEach(ball => {
        const spot = table.getBallSpot(ball.type);
        ball.respawn(spot.x, spot.y);
    });
}

/**
 * Setup mode 2: Random red balls only
 */
function setupRandomReds() {
    // Place colored balls on their spots first
    coloredBalls.forEach(ball => {
        const spot = table.getBallSpot(ball.type);
        ball.respawn(spot.x, spot.y);
    });
    
    // Randomly place red balls
    redBalls.forEach(ball => {
        let placed = false;
        let attempts = 0;
        
        while (!placed && attempts < 100) {
            // Random position within playing area
            let x = random(table.playAreaX + table.ballRadius * 2, 
                          table.playAreaX + table.playAreaWidth - table.ballRadius * 2);
            let y = random(table.playAreaY + table.ballRadius * 2, 
                          table.playAreaY + table.playAreaLength - table.ballRadius * 2);
            
            // Check if position is valid (not overlapping)
            if (isValidBallPosition(x, y, ball)) {
                ball.respawn(x, y);
                placed = true;
            }
            attempts++;
        }
    });
}

/**
 * Setup mode 3: Random all balls
 */
function setupRandomAll() {
    // Randomly place all balls (except cue ball)
    [...redBalls, ...coloredBalls].forEach(ball => {
        let placed = false;
        let attempts = 0;
        
        while (!placed && attempts < 100) {
            // Random position within playing area
            let x = random(table.playAreaX + table.ballRadius * 2, 
                          table.playAreaX + table.playAreaWidth - table.ballRadius * 2);
            let y = random(table.playAreaY + table.ballRadius * 2, 
                          table.playAreaY + table.playAreaLength - table.ballRadius * 2);
            
            // Check if position is valid
            if (isValidBallPosition(x, y, ball)) {
                ball.respawn(x, y);
                placed = true;
            }
            attempts++;
        }
    });
}

/**
 * Check if a position is valid for placing a ball
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {Ball} ballToPlace - Ball being placed
 * @returns {boolean} - True if position is valid
 */
function isValidBallPosition(x, y, ballToPlace) {
    // Check distance from all other balls
    for (let ball of balls) {
        if (ball !== ballToPlace && !ball.isPocketed && ball !== cueBall) {
            let d = dist(x, y, ball.body.position.x, ball.body.position.y);
            if (d < table.ballRadius * 2.5) { // Minimum spacing
                return false;
            }
        }
    }
    
    // Check distance from pockets
    for (let pocket of table.pockets) {
        let d = dist(x, y, pocket.x, pocket.y);
        if (d < pocket.radius + table.ballRadius * 2) {
            return false;
        }
    }
    
    return true;
}

/**
 * Draw cue ball placement indicator
 */
function drawCueBallPlacement() {
    if (table.isInDZone(mouseX, mouseY)) {
        // Show valid placement
        push();
        fill(255, 255, 255, 100);
        noStroke();
        circle(mouseX, mouseY, table.ballRadius * 2);
        
        // Draw placement hint
        fill(255);
        textAlign(CENTER);
        text("Click to place cue ball", mouseX, mouseY - 30);
        pop();
    }
}

/**
 * Check for pocketed balls and handle them
 */
function checkPocketedBalls() {
    balls.forEach(ball => {
        if (!ball.isPocketed && ball.checkPocket(table.pockets)) {
            handlePocketedBall(ball);
        }
    });
}

/**
 * Handle a pocketed ball
 * @param {Ball} ball - The pocketed ball
 */
function handlePocketedBall(ball) {
    if (ball.type === 'cue') {
        // Cue ball pocketed - need to replace
        ball.pocket();
        cueBallPlaced = false;
        placingCueBall = true;
        showMessage("Cue ball pocketed! Place it back in the D zone");
        cue.hide();
    } else if (ball.type === 'red') {
        // Red ball pocketed - remove permanently
        ball.pocket();
        showMessage("Red ball pocketed!");
    } else {
        // Colored ball pocketed - respawn at spot
        ball.pocket();
        const spot = table.getBallSpot(ball.type);
        
        // Add to potted balls tracking
        lastPottedBalls.push(ball.type);
        if (lastPottedBalls.length > 2) {
            lastPottedBalls.shift();
        }
        
        // Check for consecutive colored balls
        if (lastPottedBalls.length === 2 && 
            !lastPottedBalls.includes('red')) {
            showMessage("ERROR: Two consecutive colored balls potted!", 5000);
        } else {
            showMessage(`${ball.type} ball pocketed! Respawning...`);
        }
        
        // Respawn after a delay
        setTimeout(() => {
            ball.respawn(spot.x, spot.y);
        }, 1000);
    }
}

/**
 * Check if any ball is moving
 * @returns {boolean} - True if any ball is moving
 */
function isAnyBallMoving() {
    return balls.some(ball => !ball.isPocketed && ball.isMoving());
}

/**
 * Show a message to the player
 * @param {string} msg - Message to show
 * @param {number} duration - Duration in milliseconds (default 2000)
 */
function showMessage(msg, duration = 2000) {
    message = msg;
    messageTimer = millis() + duration;
}

/**
 * Display the current message
 */
function displayMessage() {
    if (message && millis() < messageTimer) {
        push();
        fill(255, 255, 255, 200);
        noStroke();
        rectMode(CENTER);
        rect(width/2, 50, textWidth(message) + 40, 40, 10);
        
        fill(0);
        textAlign(CENTER, CENTER);
        textSize(16);
        text(message, width/2, 50);
        pop();
    }
}

/**
 * Display game information
 */
function displayGameInfo() {
    push();
    fill(255);
    textAlign(LEFT);
    textSize(14);
    
    // Power indicator
    text(`Power: ${Math.round(cue.power * 100)}%`, 10, height - 60);
    
    // Mode indicator
    let modeText = "No mode selected";
    if (gameMode === 1) modeText = "Mode 1: Starting Position";
    else if (gameMode === 2) modeText = "Mode 2: Random Reds";
    else if (gameMode === 3) modeText = "Mode 3: Random All";
    text(modeText, 10, height - 40);
    
    // Game state indicators for debugging
    let stateText = "";
    if (placingCueBall) {
        stateText = "STATE: Place cue ball in D zone";
        fill(255, 255, 0); // Yellow for placing state
    } else if (cueBallPlaced && cue.isVisible) {
        stateText = "STATE: Ready to aim and shoot";
        fill(0, 255, 0); // Green for ready state
    } else if (isAnyBallMoving()) {
        stateText = "STATE: Balls in motion...";
        fill(255, 165, 0); // Orange for motion state
    } else {
        stateText = "STATE: Unknown";
        fill(255, 0, 0); // Red for unknown state
    }
    text(stateText, 10, height - 20);
    
    pop();
}

/**
 * Mouse pressed event
 */
function mousePressed() {
    console.log("Mouse pressed - placingCueBall:", placingCueBall, "cueBallPlaced:", cueBallPlaced, "isInDZone:", table.isInDZone(mouseX, mouseY));
    
    // Handle cue ball placement
    if (placingCueBall && table.isInDZone(mouseX, mouseY)) {
        // Check if position is valid
        if (isValidBallPosition(mouseX, mouseY, cueBall)) {
            cueBall.respawn(mouseX, mouseY);
            cueBallPlaced = true;
            placingCueBall = false;
            
            // Make cue visible immediately when cue ball is placed
            cue.isVisible = true;
            cue.updateAngle(cueBall, mouseX, mouseY);
            
            console.log("Cue ball placed successfully");
            showMessage("Cue ball placed! Click and drag to aim and shoot");
        } else {
            console.log("Invalid cue ball position");
            showMessage("Invalid position! Too close to other balls");
        }
    }
    // Start aiming if cue ball is placed
    else if (cueBallPlaced && !placingCueBall && !isAnyBallMoving()) {
        console.log("Starting to aim");
        cue.startAiming(cueBall, balls);
    } else {
        console.log("Mouse pressed but no valid action - placingCueBall:", placingCueBall, "cueBallPlaced:", cueBallPlaced, "anyBallMoving:", isAnyBallMoving());
    }
}

/**
 * STEP 5: Professional Cue Control - Mouse moved event
 * Update cue angle and contact point for advanced ball control
 */
function mouseMoved() {
    if (cue.isAiming && cueBall && cueBallPlaced) {
        // Update cue angle for aiming direction
        cue.updateAngle(cueBall, mouseX, mouseY);
        
        // PROFESSIONAL SPIN CONTROL: Hold Shift + mouse movement for contact point control
        if (keyIsDown(SHIFT)) {
            cue.setContactPoint(cueBall, mouseX, mouseY);
        }
    }
}

/**
 * Mouse dragged event
 */
function mouseDragged() {
    if (cue.isAiming) {
        cue.updateAngle(cueBall, mouseX, mouseY);
        cue.updatePullback(cueBall, mouseX, mouseY);
    }
}

/**
 * Mouse released event
 */
function mouseReleased() {
    if (cue.isAiming) {
        cue.shoot(cueBall);
    }
}

/**
 * Key pressed event
 */
function keyPressed() {
    // Ball placement modes
    if (key === '1') {
        console.log("Switching to mode 1");
        setupBallsMode(1);
    } else if (key === '2') {
        console.log("Switching to mode 2");
        setupBallsMode(2);
    } else if (key === '3') {
        console.log("Switching to mode 3");
        setupBallsMode(3);
    }
    
    // Power adjustment
    if (keyCode === UP_ARROW) {
        cue.adjustPower(1);
        showMessage(`Power: ${Math.round(cue.power * 100)}%`, 500);
    } else if (keyCode === DOWN_ARROW) {
        cue.adjustPower(-1);
        showMessage(`Power: ${Math.round(cue.power * 100)}%`, 500);
    }
}

/**
 * Draw custom cursor/crosshair within game area for better aiming visual feedback
 */
function drawCustomCursor() {
    // Only show custom cursor when:
    // 1. Cue ball is placed (not during placement)
    // 2. Not in placing cue ball mode
    // 3. Mouse is within the table area
    // 4. No balls are moving
    if (cueBallPlaced && !placingCueBall && !isAnyBallMoving() &&
        mouseX > table.playAreaX && mouseX < table.playAreaX + table.playAreaWidth &&
        mouseY > table.playAreaY && mouseY < table.playAreaY + table.playAreaLength) {
        
        push();
        stroke(255, 255, 0, 180); // Bright yellow with transparency
        strokeWeight(2);
        
        // Draw crosshair
        const crossSize = 15;
        line(mouseX - crossSize, mouseY, mouseX + crossSize, mouseY); // Horizontal line
        line(mouseX, mouseY - crossSize, mouseX, mouseY + crossSize); // Vertical line
        
        // Draw small circle at center
        noFill();
        stroke(255, 255, 0, 120);
        strokeWeight(1);
        circle(mouseX, mouseY, 8);
        
        // Hide default cursor when within game area
        noCursor();
        
        pop();
    } else {
        // Show default cursor when:
        // - Outside game area
        // - During cue ball placement
        // - When balls are moving
        // - When cue ball is not placed
        cursor(ARROW);
    }
} 