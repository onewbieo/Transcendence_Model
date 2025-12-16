import type { Paddle, Ball } from "./types.js";
import {
	MAX_SCORE,
	PADDLE_WIDTH, PADDLE_HEIGHT, PADDLE_MARGIN, PADDLE_SPEED,
	BALL_RADIUS, BALL_SPEED, BALL_SPEEDUP, BALL_MAX_SPEED,
} from "./constants.js";

import { clamp, hitPaddle, serveBallWithDelay } from "./physics.js";
import {
	drawBackground, drawPaddle, drawBall, drawScore, drawGameOver, drawPausedOverlay
} from "./render.js";

// Run this after the HTML is loaded
window.addEventListener("DOMContentLoaded", () =>
{
	const	canvas = document.getElementById("pong") as HTMLCanvasElement | null;
	if (!canvas)
	{
		console.error("Canvas with id 'pong' not found");
		return;
	}

	const	ctx = canvas.getContext("2d");
	if (!ctx)
	{
		console.error("Could not get 2D context");
		return;
	}

	// Canvas dimensions
	const   width = canvas.width;
	const   height = canvas.height;

	let	leftScore = 0;
	let	rightScore = 0;
	let	gameOver = false;

	// Left Paddle
	const	leftPaddle: Paddle = {
		x:		PADDLE_MARGIN,
		y:		(height - PADDLE_HEIGHT) / 2,
		width:	PADDLE_WIDTH,
		height: PADDLE_HEIGHT,
		color:	"white",
		speed:	PADDLE_SPEED,
	};

	// Right Paddle
	const	rightPaddle: Paddle = {
		x:		width - PADDLE_MARGIN - PADDLE_WIDTH,
		y:		(height - PADDLE_HEIGHT) / 2,
		width:	PADDLE_WIDTH,
		height:	PADDLE_HEIGHT,
		color:	"white",
		speed:	PADDLE_SPEED,
	};
	
	const ball: Ball = {
		x:		width / 2,
		y:		height / 2,
		radius:	BALL_RADIUS,
		color:	"white",
		vx:		BALL_SPEED, // start moving to right
		vy:		BALL_SPEED * 0.7, // slight diagonal
	};

	//Input handling (keyboard)
	let keys:       Record<string, boolean> = {};
	
	let	pausedManual = false;
	let	pausedAuto = false;
	let	pauseMessage = "";

	document.addEventListener("keydown", (e) => {
		keys[e.key] = true;
		if ((e.key === "p" || e.key === "P") && !e.repeat)
		{
			if (pausedAuto)
			{
				pausedAuto = false;
				pauseMessage = "";
			}
			else
			{
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

	const onPause = (msg: string) =>
	{
		pausedAuto = true;
		pauseMessage = msg;
	};

	const onResume = () =>
	{
		pausedAuto = false;
		pauseMessage = "";
	};

	const	isPaused = () => pausedManual || pausedAuto;

	// Update game state (movement)
	const	update = () => {
		console.log("Update frame, ball:", ball.x, ball.y,"vx:", ball.vx,  "vy:", ball.vy);
		// Left Paddle: W (up), S (down)
		if (keys["w"] || keys["W"])
		{
			leftPaddle.y -= leftPaddle.speed;
		}
		if (keys["s"] || keys["S"])
		{
			leftPaddle.y += leftPaddle.speed;
		}
		leftPaddle.y = clamp(leftPaddle.y, 0, height - leftPaddle.height);

		// Right paddle: ArrowUp (up), ArrowDown (down)
		if (keys["ArrowUp"])
		{
			rightPaddle.y -= rightPaddle.speed;
		}
		if (keys["ArrowDown"])
		{
			rightPaddle.y += rightPaddle.speed;
		}
		rightPaddle.y = clamp(rightPaddle.y, 0, height - rightPaddle.height);
		
		ball.x += ball.vx;
		ball.y += ball.vy;

		// Bounce on top / bottom walls
		if (ball.y - ball.radius < 0 || ball.y + ball.radius > height)
		{
			ball.vy *= -1;
		}

		// if ball going left
		if (ball.vx < 0 && hitPaddle(leftPaddle, ball))
		{
			console.log("Hit LEFT paddle");
			// where did the ball hit the paddle ? 
			const	paddleCenter = leftPaddle.y + leftPaddle.height / 2;
			const	distanceFromCenter = ball.y - paddleCenter;

			// Normalise -1 to 1
			const	normalized = clamp(
				distanceFromCenter / (leftPaddle.height / 2),
				-1,
				1
			);

			// Increase speed
			const	speed = Math.min(
				Math.hypot(ball.vx, ball.vy) * BALL_SPEEDUP,
				BALL_MAX_SPEED
			);

			// Bounce right
			ball.vx = Math.abs(speed);
			ball.vy = normalized * speed;

			// Push ball out to avoid sticking
			ball.x = leftPaddle.x + leftPaddle.width + ball.radius;
		}

		// if ball going right
		if (ball.vx > 0 && hitPaddle(rightPaddle, ball))
		{
			console.log("Hit RIGHT paddle");
			
			const	paddleCenter = rightPaddle.y + rightPaddle.height / 2;
			const	distanceFromCenter = ball.y - paddleCenter;
			const	normalized = clamp(
				distanceFromCenter / (rightPaddle.height / 2),
				-1,
				1
			);

			const	speed = Math.min(
				Math.hypot(ball.vx, ball.vy) * BALL_SPEEDUP,
				BALL_MAX_SPEED
			);

			// Bounce left 
			ball.vx = -Math.abs(speed);
			ball.vy = normalized * speed;

			ball.x = rightPaddle.x - ball.radius;
		}
		
		// out of bounds scenario	
		if (ball.x + ball.radius < 0 || ball.x - ball.radius > width)
		{
			if (ball.x + ball.radius < 0)
			{
				rightScore++;
				if (rightScore >= MAX_SCORE)
					gameOver = true;
				serveBallWithDelay(ball, width, height, 1, onPause, onResume);
				return;
			}
			if (ball.x - ball.radius > width)
			{
				leftScore++;
				if (leftScore >= MAX_SCORE)
					gameOver = true;
				serveBallWithDelay(ball, width, height, -1, onPause, onResume);
				return;
			}
		}
	};

	//One frame render
	const	render = () =>
	{
		drawBackground(ctx, width, height);
		drawScore(ctx, leftScore, rightScore, width);
		drawPaddle(ctx, leftPaddle);
		drawPaddle(ctx, rightPaddle);
		drawBall(ctx, ball);
	};

	// Main loop
	const loop = () =>
	{
		if (gameOver)
		{
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
