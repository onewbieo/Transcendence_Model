// Lets start with types.ts first //
export	type Paddle = { // export word is used so that you can use other .js files creating a Paddle type Can call many different objects after that //
	x:      number; // x position determines where it starts on the canvas //
	y:      number; // y position determines paddle movement up and down //
	width:  number;	// how wide is it //
	height: number;	// how high is it //
	color:  string;	// colour of the paddle //
	speed:	number;	// paddle movement speed //
};
	
export	type Ball = { // creating a ball type //
	x:		number;	// horizontal position on canvas //
	y:		number;	// vertical position on canvas //
	radius:	number;		// radius is needed to capture the whole ball //
	color:	string;		// ball colour //
	vx:		number; // horizontal speed of ball //
	vy:		number;	// vertical speed of ball //
};

// Constant.ts first //
// Scoreboard //
export const	MAX_SCORE = 8;  // export word is used so that we can use it in other .js files //

// Paddle Constants
export const	PADDLE_WIDTH = 20; // export word is used so that we can use it in other .js files //
export const	PADDLE_HEIGHT = 100; // export word is used so that we can use it in other .js files //
export const	PADDLE_MARGIN = 40; // export word is used so that we can use it in other .js files //
export const	PADDLE_SPEED = 6; // export word is used so that we can use it in other .js files //

// Ball Constants
export const	BALL_RADIUS = 10; // export word is used so that we can use it in other .js files //
export const	BALL_SPEED = 5; // export word is used so that we can use it in other .js files //
export const	BALL_SPEEDUP = 1.06; // export word is used so that we can use it in other .js files //
export const	BALL_MAX_SPEED = 14; // export word is used so that we can use it in other .js files //

// Pause after score
export const	SERVE_DELAY_MS = 1000; // export word is used so that we can use it in other .js files //
					// 1000 ms = 1 sec //

// Physics.ts //
import type { Paddle, Ball } from "./types.js"; // we declare Paddle and ball Objects from types.js //
import { BALL_SPEED, SERVE_DELAY_MS } from "./constants.js"; // we needed BALL_SPEED and SERVE_DELAYS constants inside this function hence we import the variables over //

export const clamp = (value: number, min: number, max: number): number =>
	Math.max(min, Math.min(max, value)); // clamp is a function to keep value within the limits of the canvas // 
	// if value too small, use min, if value too big, use max, otherwise keep the value as it is //
	// give me the smaller value of max, value first //
	// then give me the max value of min, result of the first operation //
	// value represents something in that position. paddle.x, paddle.y, ball.x, ball.y //
	
export const hitPaddle = (p: Paddle, ball: Ball): boolean => { // ball collison function. Is the ball currently overlapping the paddle ? // 
	const	paddleLeft = p.x; 			// turns paddle into rectangle //
	const	paddleRight = p.x + p.width;
	const	paddleTop = p.y;			
	const	paddleBottom = p.y + p.height;

	const	ballLeft = ball.x - ball.radius;	// turns ball into rectangle //
	const	ballRight = ball.x + ball.radius;
	const	ballTop = ball.y - ball.radius;
	const	ballBottom = ball.y + ball.radius;

	const	overlapX = ballRight > paddleLeft && ballLeft < paddleRight; // does the ball overlap the paddle horizontally ? //
	const 	overlapY = ballBottom > paddleTop && ballTop < paddleBottom; // does the ball overlap the paddle vertically ? //

	return overlapX && overlapY; // both must overlap for collison to occur //
};

const randomServeAngle = (): number => // when serving, give a random angle //
{
	const maxAngle = Math.PI / 6; // 30 degree angle //
	return (Math.random() * 2 - 1) * maxAngle; // not sure about the maths here //
};

export const	resetBall = (ball: Ball, width: number, height: number, direction: 1 | -1) => { // so reset ball needed certain variables like Ball Object, width of canvas, height of canvas, direction to face 1 = right -1 = left //
	ball.x = width / 2; //	center the ball //
	ball.y = height / 2; // center the ball //
	const angle = randomServeAngle(); // generate random angle //
	ball.vx = Math.cos(angle) * BALL_SPEED * direction; // cosine controls x direction and strength //
	ball.vy = Math.sin(angle) * BALL_SPEED; // sine controls y direction and strength //
};

export const serveBallWithDelay = ( // doing 2 jobs here, reset the ball to the center and control the serve timing //
	ball: Ball,	// ball object //
	width: number,	// canvas width //
	height: number,	// canvas height //
	direction: 1 | -1, // direction 1 = right, -1 = left //
	onPause: (msg: string) => void, // pause the game and show text generic function //
	onResume: () => void, // resume game. generic function //
	delayMs: number = SERVE_DELAY_MS
) => {
	onPause(direction === 1 ? "RIGHT SERVES" : "LEFT SERVES"); // based on which direction while pausing, display message //
	resetBall(ball, width, height, direction); // resetting the ball //
	
	setTimeout(() => // delay by delayMs and run the code inside //
	{
		onResume(); // resumption of game //
	}, delayMs);
};


// render.ts //
import type { Paddle, Ball } from "./types.js"; // we needed the Paddle and Ball so we extract from that file // 

export const drawBackground = (ctx: CanvasRenderingContext2D, width: number, height: number) => { // CanvasRenderingContext2D is an object where canvas.getContext generates if valid.
// drawing the background of the canvas //
	// Background color //
	ctx.fillStyle = "black"; // color //
	ctx.fillRect(0, 0, width, height); // fills up the whole canvas coordinates with the colour //

	// Center dashed line //
	ctx.strokeStyle = "gray";	// pen color //
	ctx.setLineDash([10, 10]);	// dashLength, gapLength //
	ctx.beginPath();		// lift pen, start a new drawing //
	ctx.moveTo(width / 2, 0);	// move pen without drawing //
	ctx.lineTo(width / 2, height);	// draw a line to this point //
	ctx.stroke();			// actually draw the path //
	ctx.setLineDash([]);		// reset to solid //
};

export const	drawPaddle = (ctx: CanvasRenderingContext2D, p: Paddle) => { // drawing the Paddle //
	ctx.fillStyle = p.color;	// color of the Paddle //
	ctx.fillRect(p.x, p.y, p.width, p.height); // draws the rectangle up //
};

export const	drawBall = (ctx: CanvasRenderingContext2D, ball: Ball) => { // drawing the ball //
	ctx.beginPath();	// lift pen, start a new drawing //
	ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2); // draw the circle //
	ctx.fillStyle = ball.color; 	// colour of ball // 
	ctx.fill();		   // color it into the canvas //
	ctx.closePath();	// put pen down //
};

export const	drawScore = ( // scoreboard counting //
	ctx: CanvasRenderingContext2D,
	leftScore:	number,
	rightScore:	number,
	width:		number
) => {
	ctx.font = "32px Arial";	// font size of type //
	ctx.fillStyle = "white";	// color of score //
	ctx.textAlign = "center";	// x and y position I give you should be the center of the text, not the left edge //
	ctx.fillText(leftScore.toString(), width / 4, 50); // canvas only draw strings for leftScore //
	ctx.fillText(rightScore.toString(), (width * 3) / 4, 50); // canvas only draw strings for rightScore //
};

export const	drawGameOver = (	// game over message //
	ctx:	CanvasRenderingContext2D,
	width:		number,
	height:		number,
	leftScore:	number,
	rightScore:	number
) => {
	ctx.fillStyle = "white";	// color of text //
	ctx.font = "48px Arial";	// font size and type //
	ctx.textAlign = "center";	// x and y position I give you should be the center of the text, not the left edge //
	ctx.fillText("GAME OVER", width / 2, height / 2 - 20); // Position where you put message //

	let	winnerText = "";
	if (leftScore > rightScore)
		winnerText = "Left Player Wins!";
	else if (rightScore > leftScore)
		winnerText = "Right Player Wins!";
	ctx.font = "32px Arial";
	ctx.fillText(winnerText, width / 2, height / 2 + 30);	// Position where you put message //
};

export const	drawPausedOverlay = ( // Pause message when autoPaused or manualPaused //
	ctx:	CanvasRenderingContext2D,	
	msg:	string,
	width:	number,
	height:	number
) => {
	ctx.font = "32px Arial";	// font size and type //
	ctx.fillStyle = "white";	// color of text //
	ctx.textAlign = "center";	// x and y position I give you should be the center of the text, not the left edge //
	ctx.fillText(msg, width / 2, height / 2);	// Position where you put message //
};

// main .ts //
import type { Paddle, Ball } from "./types.js"; // need Paddle and Ball type //
import {
	MAX_SCORE,
	PADDLE_WIDTH, PADDLE_HEIGHT, PADDLE_MARGIN, PADDLE_SPEED,
	BALL_RADIUS, BALL_SPEED, BALL_SPEEDUP, BALL_MAX_SPEED,
} from "./constants.js";			// need the constant variables declared //

import { clamp, hitPaddle, serveBallWithDelay } from "./physics.js";	// functions needed there //
import {
	drawBackground, drawPaddle, drawBall, drawScore, drawGameOver, drawPausedOverlay
} from "./render.js";				// functions inside render //

// Run this after the HTML is loaded
window.addEventListener("DOMContentLoaded", () => // () => same as function() Essentially you are saying Let DOMContentLoaded load up all the html elements first, once its done then we execute rest of code //
{
	const	canvas = document.getElementById("pong") as HTMLCanvasElement | null; // I'm telling typescript this is a canvas specific HTMLElement so its called HTMLCanvasElement. If not i cannot access getContext later. Might be Null as well if you cannot find the Id //
	if (!canvas)
	{
		console.error("Canvas with id 'pong' not found");
		return;
	}

	const	ctx = canvas.getContext("2d");
	// drawing tool for the canvas //
	// 2d = simple 2D shapes //
	// webgl = 3D rendering // 
	// bitmaprenderer = raw pixel copying //
	if (!ctx)
	{
		console.error("Could not get 2D context");
		return;
	}
	// drawing shapes //
	// ctx.fillRect(x, y, width, height) //
	// ctx.strokeRect(x, y, width, height) //
	
	// drawing text //
	// ctx.fillText(text, x, y) //
	
	// drawing circles //
	// ctx.arc(x, y, radius, startAngle, endAngle) //
	// ctx.fill()
	
	// Coloring //
	// ctx.fillStyle = "color" //
	// ctx.strokeStyle = "gray" //
	
	// Clearing screen // 
	// ctx.clearRect(x, y, width, height) //
	
	// Canvas dimensions
	const   width = canvas.width;
	const   height = canvas.height;

	let		leftScore = 0;		// left scoreboard //
	let		rightScore = 0;		// right scoreboard //
	let		gameOver = false;	// gameOver flag //
	
	// Left Paddle
	const	leftPaddle: Paddle = 
	{
		x:		PADDLE_MARGIN,	// spacing from the start of canvas //
		y:		(height - PADDLE_HEIGHT) / 2, // remaining distance //
		width:	PADDLE_WIDTH,
		height: PADDLE_HEIGHT,
		color:	"white",
		speed:	PADDLE_SPEED,
	};

	// Right Paddle
	const	rightPaddle: Paddle =
	{
		x:		width - PADDLE_MARGIN - PADDLE_WIDTH, // from the right margin and then go to the leftmost of the range //
		y:		(height - PADDLE_HEIGHT) / 2, // remaining distance // 
		width:	PADDLE_WIDTH,
		height:	PADDLE_HEIGHT,
		color:	"white",
		speed:	PADDLE_SPEED,
	};
	
	// Ball
	const ball: Ball =
	{
		x:		width / 2,
		y:		height / 2,
		radius:	BALL_RADIUS,
		color:	"white",
		vx:		BALL_SPEED, // start moving to right
		vy:		BALL_SPEED * 0.7, // slight diagonal
	};

	//Input handling (keyboard)
	let keys:       Record<string, boolean> = {};	// creating a map //
	
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
	const	update = () =>
	{
		console.log("Update frame, ball:", ball.x, ball.y,"vx:", ball.vx,  "vy:", ball.vy);
		// Left Paddle: W (up), S (down)
		if (keys["w"] || keys["W"])
		{
			leftPaddle.y -= leftPaddle.speed;	// left paddle moving up //
		}
		if (keys["s"] || keys["S"])
		{
			leftPaddle.y += leftPaddle.speed;	// left paddle moving down //
		}
		leftPaddle.y = clamp(leftPaddle.y, 0, height - leftPaddle.height); // Make the paddle position within the limits of the canvas //

		// Right paddle: ArrowUp (up), ArrowDown (down)
		if (keys["ArrowUp"])
		{
			rightPaddle.y -= rightPaddle.speed;	// right paddle moving up //
		}
		if (keys["ArrowDown"])
		{
			rightPaddle.y += rightPaddle.speed;	// right paddle moving down //
		}
		rightPaddle.y = clamp(rightPaddle.y, 0, height - rightPaddle.height); // Make the paddle position within the limits of the canvas //
		
		ball.x += ball.vx;	// every frame update the ball x position using ball speed and direction //
		ball.y += ball.vy;	// every frame update the ball y position using ball speed and direction //

		// Bounce on top / bottom walls
		if (ball.y - ball.radius < 0 || ball.y + ball.radius > height) // edge of ball touch canvas ? //
		// ball.y - ball.radius = top edge //
		// ball.y + ball.radius = bottom edge //
		{
			ball.vy *= -1; // if it hits the top or bottom then change direction //
		}
		
		// if ball going left && collison with left paddle //
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

		// if ball going right && collison with right paddle //
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
		if (ball.x + ball.radius < 0 || ball.x - ball.radius > width) // edge of ball touch canvas //
		{
			if (ball.x + ball.radius < 0) // if it exits on left side //
			{
				rightScore++;	// right side scores //
				if (rightScore >= MAX_SCORE)
					gameOver = true;	// if more than or equal 8 points //
				serveBallWithDelay(ball, width, height, 1, onPause, onResume);
				return;
			}
			if (ball.x - ball.radius > width)	// if it exits on right side //
			{
				leftScore++;	// left side scores //
				if (leftScore >= MAX_SCORE)
					gameOver = true;	// if more than or equal 8 points //
				serveBallWithDelay(ball, width, height, -1, onPause, onResume);
				return;
			}
		}
	};

	//One frame render
	const	render = () =>
	{
		drawBackground(ctx, width, height); // draw background first //
		drawScore(ctx, leftScore, rightScore, width);	// draw score //
		drawPaddle(ctx, leftPaddle); // draw leftPaddle //
		drawPaddle(ctx, rightPaddle); // draw rightPaddle //
		drawBall(ctx, ball);	// draw ball //
	};

	// Main loop
	const loop = () =>
	{
		if (gameOver) // if point more than MAXSCORE //
		{
			render(); 
			drawGameOver(ctx, width, height, leftScore, rightScore); // draw game over scenatio //
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
