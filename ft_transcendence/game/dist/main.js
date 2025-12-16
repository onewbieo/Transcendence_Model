import { MAX_SCORE, PADDLE_WIDTH, PADDLE_HEIGHT, PADDLE_MARGIN, PADDLE_SPEED, BALL_RADIUS, BALL_SPEED, BALL_SPEEDUP, BALL_MAX_SPEED, } from "./constants";
import { clamp, hitPaddle, resetBall } from "./physics";
import { drawBackground, drawPaddle, drawBall, drawScore, drawGameOver, drawPausedOverlay } from "./render";
// Run this after the HTML is loaded
window.addEventListener("DOMContentLoaded", () => {
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
    /*type Paddle =
    {
        x:      number;
        y:      number;
        width:  number;
        height: number;
        color:  string;
        speed:	number;
    };
    
    type	Ball =
    {
        x:		number;
        y:		number;
        radius:	number;
        color:	string;
        vx:		number;
        vy:		number;
    };*/
    let leftScore = 0;
    let rightScore = 0;
    /*const	MAX_SCORE = 8;*/
    let gameOver = false;
    /*// Paddle Constants
    const	PADDLE_WIDTH = 20;
    const	PADDLE_HEIGHT = 100;
    const	PADDLE_MARGIN = 40;
    const	PADDLE_SPEED = 6;
    
    // Ball Constants
    const	BALL_RADIUS = 10;
    const	BALL_SPEED = 5;
    const	BALL_SPEEDUP = 1.06;
    const	BALL_MAX_SPEED = 14;*/
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
    /*// Drawing Helpers
    const	drawBackground = () =>
    {
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

    const	drawPaddle = (p: Paddle) =>
    {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.width, p.height);
    };
    
    const	drawBall = () =>
    {
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI *2);
        ctx.fillStyle = ball.color;
        ctx.fill();
        ctx.closePath();
    };

    const	drawScore = () =>
    {
            ctx.font = "32px Arial";
            ctx.fillStyle = "white";
            ctx.textAlign = "center";

            ctx.fillText(leftScore.toString(), width / 4, 50);
            ctx.fillText(rightScore.toString(), (width * 3) / 4, 50);
    };

    const	drawGameOver = () =>
    {
        ctx.fillStyle = "white";

        ctx.font = "48px Arial";
        ctx.textAlign = "center";

        ctx.fillText("GAME OVER", width / 2, height / 2 - 20);
        let	winnerText = "";
        if (leftScore > rightScore)
            winnerText = "Left Player Wins!";
        else if (rightScore > leftScore)
            winnerText = "Right Player Wins!";
        ctx.font = "32px Arial";
        ctx.fillText(winnerText, width / 2, height / 2 + 30);
    };

    const	drawPausedOverlay = (msg: string) =>
    {
        ctx.font = "32px Arial";
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.fillText("PAUSED (P to resume)", width / 2, height / 2);
    }*/
    //Input handling (keyboard)
    let keys = {};
    let pausedManual = false;
    let pausedAuto = false;
    let pauseMessage = "";
    document.addEventListener("keydown", (e) => {
        keys[e.key] = true;
        if ((e.key === "p" || e.key === "P") && !e.repeat) {
            if (pausedAuto) {
                pausedAuto = false;
                pauseMessage = "";
            }
            else {
                pausedManual = !pausedManual;
                pauseMessage = pausedManual ? "PAUSED (P to resume)" : "";
            }
        }
    });
    document.addEventListener("keyup", (e) => {
        keys[e.key] = false;
    });
    window.addEventListener("blur", () => {
        pausedAuto = true;
        pauseMessage = "PAUSED (press P to resume)";
        keys = {};
    });
    window.addEventListener("focus", () => {
        keys = {};
    });
    const isPaused = () => pausedManual || pausedAuto;
    /*//Small helper to keep values inside a range
    const	clamp = (value: number, min: number, max: number): number =>
    {
        return Math.max(min, Math.min(max, value));
    };

    const	hitPaddle = (p: Paddle): boolean =>
    {
            const	paddleLeft = p.x;
            const	paddleRight = p.x + p.width;
            const	paddleTop = p.y;
            const	paddleBottom = p.y + p.height;

            const	ballLeft = ball.x - ball.radius;
            const	ballRight = ball.x + ball.radius;
            const	ballTop = ball.y - ball.radius;
            const	ballBottom = ball.y + ball.radius;

            const	overlapX = ballRight > paddleLeft && ballLeft < paddleRight;
            const 	overlapY = ballBottom > paddleTop && ballTop < paddleBottom;

            return overlapX && overlapY;
    };

    const	resetBall = (direction: 1 | -1) =>
    {
        ball.x = width / 2;
        ball.y = height /2;
        ball.vx = direction * BALL_SPEED;
        ball.vy = BALL_SPEED * 0.7;
    };*/
    // Update game state (movement)
    const update = () => {
        console.log("Update frame, ball:", ball.x, ball.y, "vx:", ball.vx, "vy:", ball.vy);
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
        // if ball going left
        if (ball.vx < 0 && hitPaddle(leftPaddle, ball)) {
            console.log("Hit LEFT paddle");
            // where did the ball hit the paddle ? 
            const paddleCenter = leftPaddle.y + leftPaddle.height / 2;
            const distanceFromCenter = ball.y - paddleCenter;
            // Normalise -1 to 1
            const normalized = clamp(distanceFromCenter / (leftPaddle.height / 2), -1, 1);
            // Increase speed
            const speed = Math.min(Math.hypot(ball.vx, ball.vy) * BALL_SPEEDUP, BALL_MAX_SPEED);
            // Bounce right
            ball.vx = Math.abs(speed);
            ball.vy = normalized * speed;
            // Push ball out to avoid sticking
            ball.x = leftPaddle.x + leftPaddle.width + ball.radius;
        }
        // if ball going right
        if (ball.vx > 0 && hitPaddle(rightPaddle, ball)) {
            console.log("Hit RIGHT paddle");
            const paddleCenter = rightPaddle.y + rightPaddle.height / 2;
            const distanceFromCenter = ball.y - paddleCenter;
            const normalized = clamp(distanceFromCenter / (rightPaddle.height / 2), -1, 1);
            const speed = Math.min(Math.hypot(ball.vx, ball.vy) * BALL_SPEEDUP, BALL_MAX_SPEED);
            // Bounce left 
            ball.vx = -Math.abs(speed);
            ball.vy = normalized * speed;
            ball.x = rightPaddle.x - ball.radius;
        }
        // out of bounds scenario	
        if (ball.x + ball.radius < 0 || ball.x - ball.radius > width) {
            if (ball.x + ball.radius < 0) {
                rightScore++;
                if (rightScore >= MAX_SCORE)
                    gameOver = true;
                resetBall(ball, width, height, 1);
                return;
            }
            if (ball.x - ball.radius > width) {
                leftScore++;
                if (leftScore >= MAX_SCORE)
                    gameOver = true;
                resetBall(ball, width, height, -1);
                return;
            }
        }
    };
    //One frame render
    const render = () => {
        drawBackground(ctx, width, height);
        drawScore(ctx, leftScore, rightScore, width);
        drawPaddle(ctx, leftPaddle);
        drawPaddle(ctx, rightPaddle);
        drawBall(ctx, ball);
    };
    // Main loop
    const loop = () => {
        if (gameOver) {
            render();
            drawGameOver(ctx, width, height, leftScore, rightScore);
            return;
        }
        if (!isPaused())
            update();
        render();
        if (isPaused())
            drawPausedOverlay(ctx, pauseMessage || "PAUSED", width, height);
        requestAnimationFrame(loop);
    };
    console.log("Paddles drawn:", { leftPaddle, rightPaddle });
    loop();
});
