<img width="1378" alt="image" src="https://github.com/user-attachments/assets/5b516911-f476-4d0b-a6cb-221a6efaf663" />

# Snooker Game

A snooker Game Made using JavaScript, p5.js and Matter.js

## Overview
This is a feature-rich snooker simulation game built with JavaScript. The game provides a realistic snooker experience with professional-grade physics, accurate ball behavior, and tournament-standard table dimensions. It simulates the classic game of snooker with detailed physics for ball movement, cushion bounces, spin effects, and pocket collisions.

## Features

### Professional Physics Engine
- Tournament-grade ball physics with realistic rolling resistance
- Professional cushion bounce mechanics with accurate angle reflection
- Advanced spin physics including side spin (english), top spin (follow), and back spin (draw)
- Realistic pocket dynamics with proper difficulty for corner and middle pockets

### Gameplay Elements
- Multiple table setup options (starting position, random reds, random all)
- Cue ball placement in the D zone
- Intuitive cue aiming and power control system
- Professional shot mechanics with spin control
- Realistic ball potting with proper physics

### Visual Enhancements
- Tournament-standard table dimensions and markings
- Professional-grade visual aesthetics with realistic materials
- Detailed cushions, pockets, and playing surface
- Dynamic lighting and shadow effects
- Realistic wood grain and cloth textures

## Tech Stack
- **JavaScript** - Core programming language
- **p5.js** - Canvas rendering and user interaction
- **Matter.js** - Physics engine for realistic ball and cushion physics
- **HTML5/CSS3** - Structure and styling

## Installation and Setup

1. Clone the repository:
   ```
   git clone https://github.com/ar162387/snooker.git
   ```

2. Navigate to the project directory:
   ```
   cd snooker
   ```

3. Open `index.html` in your web browser to play the game.

Alternatively, you can use a local development server:
```
npx http-server
```

## How to Play

1. **Setup the Table**:
   - Press `1` for standard starting position
   - Press `2` for random red balls only
   - Press `3` for random placement of all balls

2. **Place the Cue Ball**:
   - Click in the "D" zone to position the cue ball

3. **Aim and Shoot**:
   - Click and drag from the cue ball to aim
   - The further you drag, the more power will be applied
   - Release to take the shot
   - Use UP/DOWN arrow keys to adjust power

4. **Advanced Techniques**:
   - Click on different parts of the cue ball to apply spin:
     - Click top of ball for top spin (follow)
     - Click bottom of ball for back spin (draw)
     - Click sides of ball for side spin (english)

## Project Structure

- `index.html` - Main HTML file with game container and instructions
- `sketch.js` - Main game logic, setup, and draw functions
- `Ball.js` - Ball class with physics properties and rendering
- `Cue.js` - Cue stick class for aiming and shooting mechanics
- `SnookerTable.js` - Table rendering with cushions, pockets, and markings

## Credits
Developed as a demonstration of advanced physics simulation and game development techniques using JavaScript and modern web technologies.

## License
This project is open source and available under the MIT License.
