# Pong (TypeScript + Canvas)

PROJECT OVERVIEW
- A simple Pong game built with TypeScript and the HTML5 Canvas API.

- It includes two paddles (W/S and ArrowUp/ArrowDown), ball physics, scoring, pause and game-over detection.

CONTROLS
- Left Paddle: W or w (up), S or s (down)
- Right Paddle: ArrowUp (up), ArrowDown (down)
- Pause / Resume: P or p

HOW TO RUN
- npx tsc
- npx http-server .
- http://localhost:8080

TYPES.TS
- Defines the game object being used
- Paddle : Positon, size, speed, colour
- Ball : Position, radius, velocity, colour

CONSTANTS.TS
- Central place for fixed values:
- win condition (MAX_SCORE)
- paddle configuration (PADDLE_WIDTH, PADDLE_HEIGHT, PADDLE_MARGIN, PADDLE_SPEED)
- ball configutation (BALL_RADIUS, BALL_SPEED, BALL_SPEEDUP, BALL_MAX_SPEED)
- serve delay timer (SERVE_DELAY_MS)

PHYSICS.TS
Game physics utilities
- clamp(value, min, max) : keeps positions inside canvas bounds
- hitPaddle(paddle, ball) : AABB collison check
- randomServeAngle() : generates a random angle between -30 degrees and 30 degrees
- resetBall(...) : centers ball and gives it initial velocity
- serveBallWithDelay(...) : pauses, resets ball, resumes after delay.

RENDER.TS
All drawing functions (CanvasRenderingContext2D)
- background
- paddles
- ball
- scoreboard
- pause overlay
- game over text

MAIN.TS
Main game loop and input
- waits for DOMContentLoaded
- creates paddles/ball + scores
- handles keyboard input + pause states
- update() : movement, collison, scoring
- render() : draws one frame
- loop() : runs via request AnimationFrame


