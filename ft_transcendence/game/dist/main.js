"use strict";
// Run this after the HTML is loaded
window.addEventListener("DOMContentLoaded", () => {
    console.log("Pong game created with TypeScript");
    const canvas = document.getElementById("pong");
    if (!canvas) {
        console.error("Canvas with id 'pong' not found");
        return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
        console.error("Could not get 2D context");
        return;
    }
    // Canvas dimensions
    const width = canvas.width;
    const height = canvas.height;
    // Paddle Constants
    const PADDLE_WIDTH = 20;
    const PADDLE_HEIGHT = 100;
    const PADDLE_MARGIN = 40;
    const PADDLE_SPEED = 6;
    const BALL_RADIUS = 10;
    const BALL_SPEED = 5;
    // Left Paddle
    const leftPaddle = {
        x: PADDLE_MARGIN,
        y: (height - PADDLE_HEIGHT) / 2,
        width: PADDLE_WIDTH,
        height: PADDLE_HEIGHT,
        color: "white",
        speed: PADDLE_SPEED,
    };
    // Right Paddle
    const rightPaddle = {
        x: width - PADDLE_MARGIN - PADDLE_WIDTH,
        y: (height - PADDLE_HEIGHT) / 2,
        width: PADDLE_WIDTH,
        height: PADDLE_HEIGHT,
        color: "white",
        speed: PADDLE_SPEED,
    };
    const ball = {
        x: width / 2,
        y: height / 2,
        radius: BALL_RADIUS,
        color: "white",
        vx: BALL_SPEED, // start moving to right
        vy: BALL_SPEED * 0.7, // slight diagonal
    };
    // Drawing Helpers
    const drawBackground = () => {
        // Background color
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, width, height);
        // Center dashed line
        ctx.strokeStyle = "gray";
        ctx.setLineDash([10, 10]);
        ctx.beginPath();
        ctx.moveTo(width / 2, 0);
        ctx.lineTo(width / 2, height);
        ctx.stroke();
        ctx.setLineDash([]); // reset to solid
    };
    const drawPaddle = (p) => {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.width, p.height);
    };
    const drawBall = () => {
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = ball.color;
        ctx.fill();
        ctx.closePath();
    };
    //Input handling (keyboard)
    let keys = {};
    document.addEventListener("keydown", (e) => {
        keys[e.key] = true;
    });
    document.addEventListener("keyup", (e) => {
        keys[e.key] = false;
    });
    //Small helper to keep values inside a range
    const clamp = (value, min, max) => {
        return Math.max(min, Math.min(max, value));
    };
    // Update game state (movement)
    const update = () => {
        // Left Paddle: W (up), S (down)
        if (keys["w"] || keys["W"]) {
            leftPaddle.y -= leftPaddle.speed;
        }
        if (keys["s"] || keys["S"]) {
            leftPaddle.y += leftPaddle.speed;
        }
        leftPaddle.y = clamp(leftPaddle.y, 0, height - leftPaddle.height);
        // Right paddle: ArrowUp (up), ArrowDown (down)
        if (keys["ArrowUp"]) {
            rightPaddle.y -= rightPaddle.speed;
        }
        if (keys["ArrowDown"]) {
            rightPaddle.y += rightPaddle.speed;
        }
        rightPaddle.y = clamp(rightPaddle.y, 0, height - rightPaddle.height);
        ball.x += ball.vx;
        ball.y += ball.vy;
        // Bounce on top / bottom walls
        if (ball.y - ball.radius < 0 || ball.y + ball.radius > height) {
            ball.vy *= -1;
        }
        // out of bounds scenario	
        if (ball.x + ball.radius < 0 || ball.x - ball.radius > width) {
            ball.x = width / 2;
            ball.y = height / 2;
            ball.vx *= -1;
        }
        const hitPaddle = (p) => {
            const paddleLeft = p.x;
            const paddleRight = p.x + p.width;
            const paddleTop = p.y;
            const paddleBottom = p.y + p.height;
            const ballLeft = ball.x - ball.radius;
            const ballRight = ball.x + ball.radius;
            const ballTop = ball.y - ball.radius;
            const ballBottom = ball.y + ball.radius;
            const overlapX = ballRight > paddleLeft && ballLeft < paddleRight;
            const overlapY = ballBottom > paddleTop && ballTop < paddleBottom;
            return overlapX && overlapY;
        };
        // if ball going left
        if (ball.vx < 0 && hitPaddle(leftPaddle)) {
            console.log("Hit LEFT paddle");
            ball.vx *= -1; // bounce to the right
            ball.x = leftPaddle.x + leftPaddle.width + ball.radius; // nudge out of paddle
        }
        // if ball going right
        if (ball.vx > 0 && hitPaddle(rightPaddle)) {
            console.log("Hit RIGHT paddle");
            ball.vx *= -1; // bounce to the left
            ball.x = rightPaddle.x - ball.radius; // nudge of out paddle 
        }
    };
    //One frame render
    const render = () => {
        drawBackground();
        drawPaddle(leftPaddle);
        drawPaddle(rightPaddle);
        drawBall();
    };
    // Main loop
    const loop = () => {
        update();
        render();
        requestAnimationFrame(loop);
    };
    console.log("Paddles drawn:", { leftPaddle, rightPaddle });
    loop();
});
