this is where we talk about the game logic. we start by importing the required information from the files which we declared. 

we need the events of DOMContentLoaded first so that all HTML elements are loaded before we can start extracting the information that we want.

Followed by getting the 2d drawing kit.

Then we declare our variables like scoreboard, paddles structure, ball structure.

Here we handle the keys of the paddles, Pause Key, manualPause or autoPause.

Update handles the game flow. Like the up down keys of each paddle, canvas top and bottom limits like what happens if you reach there. Notice that i clamp the y values of both paddles so that they wont go out of range. After that, you handle ball collison. Then you handle scoring system once the ball goes out of the left or right parameters.

Then you decide what each frame does in render
1) drawbackground
2) drawScoreboard
3) drawPaddles
4) drawBall

then your main game logic. 
1) check if game winning condition is reached. If yes, game over and who won.
2) check if game is unpaused. if unpaused, update the game as it moves.
3) check if game is paused. if paused, handle the pausing procedure.
4) use request animation frame to keep repeating the loop process until game pauses or game ends.

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

window.addEventListener("DOMContentLoaded", () => // () => same as function() Essentially you are saying Let DOMContentLoaded load up all the html elements first, once its done then we execute rest of code //
{
	const	canvas = document.getElementById("pong") as HTMLCanvasElement | null; // I'm telling typescript this is a canvas specific HTML Element so its called HTMLCanvasElement. If not i cannot access getContext later. Might be Null as well if you cannot find the Id //
	if (!canvas)
	{
		console.error("Canvas with id 'pong' not found"); // error out if canvas == NULL //
		return;
	}

	const	ctx = canvas.getContext("2d");
	// drawing tool for the canvas //
	// 2d = simple 2D shapes //
	// webgl = 3D rendering // 
	// bitmaprenderer = raw pixel copying //
	if (!ctx)
	{
		console.error("Could not get 2D context"); // error out if ctx not found //
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
		width:	PADDLE_WIDTH, // to draw the full paddle out //
		height: PADDLE_HEIGHT, // to draw the full paddle out //
		color:	"white",	// color of paddle //
		speed:	PADDLE_SPEED,	// how fast the paddle can move //
	};

	// Right Paddle
	const	rightPaddle: Paddle =
	{
		x:		width - PADDLE_MARGIN - PADDLE_WIDTH, // from the right margin and then go to the leftmost of the range //
		y:		(height - PADDLE_HEIGHT) / 2, // remaining distance // 
		width:	PADDLE_WIDTH,	// to draw the full paddle out //
		height:	PADDLE_HEIGHT,	// to draw the full paddle out //
		color:	"white",	// color of paddle //
		speed:	PADDLE_SPEED,	// how fast the paddle can move //
	};
	
	// Ball
	const ball: Ball =
	{
		x:		width / 2,	// center the ball to middle of canvas //
		y:		height / 2,	// center the ball to middle of canvas //
		radius:	BALL_RADIUS,		// to draw the full ball out //
		color:	"white",		// color of ball //
		vx:		BALL_SPEED, // start moving to right
		vy:		BALL_SPEED * 0.7, // slight diagonal so that we can see some deviation of the ball as it moves prior to collison, collison with top and bottom //
	};

	//Input handling (keyboard)
	let keys:       Record<string, boolean> = {};
	// key is an object where every key is a string, every value is a boolean //
	
	let	pausedManual = false;	// Manual pause meaning pressing "p" || "P" //
	let	pausedAuto = false;	// automatic system pause depends on blur, serve delay etc // 
	let	pauseMessage = "";	// empty string for pauseMessage //

	document.addEventListener("keydown", (e) => { 
	// e is keyboard events //
	// keys is a map of key states. They start off as undefined //
	// "keydown" means a key is being pressed //
	// when a key is pressed, a KeyboardEvent is created //
						 
		keys[e.key] = true;	// putting the value as boolean now //
		if ((e.key === "p" || e.key === "P") && !e.repeat) // === is to make sure we are checking that the data types of comparison is the same //
		// !e.repeat only allows the first key press on the keyboard //
		{
			if (pausedAuto) // is the game paused automatically ? //
					// browser tab lost focus //
					// windowed blurred //
					// system-triggered pause //
			{
				pausedAuto = false;	// clear the auto pause flag //
				pauseMessage = "";	// remove the pause message //
							// do not toggle manual pause //
			}
			else
			{
				pausedManual = !pausedManual; // change the state of the flag //
				// player behavior //
				if (pausedManual) // if flag true //
					pauseMessage = "PAUSED (P to resume)"; // print out this message //
				else
					pauseMessage = ""; // remove message //
			}
		}
	});

	document.addEventListener("keyup", (e) => {
	// when a key is released, mark that eye as not pressed //
		keys[e.key] = false;
	});

	window.addEventListener("blur", () => {
	// blur means when your browser window / tab loses focus //
	// alt-tab //
	// click another tab //
	// click ouside browser window //
		pausedAuto = true;	// auto pause the game //
		pauseMessage = "PAUSED (press P to resume)"; // write the message out //
		keys = {}; // make all the keys undefined // 
	});

	window.addEventListener("focus", () => {
	// when the browser becomes active again //
		keys = {};	// make all the keys undefined //
	});

	const onPause = (msg: string) => {
	// System - generated pause here // 
		pausedAuto = true;	// set it to pause //
		pauseMessage = msg;	// pause message //
	};

	const onResume = () =>
	// let the thing resume // 
	{
		pausedAuto = false;	// set it to unpause mode //
		pauseMessage = "";	// take away the pause message //
	};

	const	isPaused = () => pausedManual || pausedAuto; 
	// isPaused returns a boolean, whether it is true or false // 

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
			// actual center of the paddle // 
			
			const	distanceFromCenter = ball.y - paddleCenter;
			// this value is in pixels //
			// if == 0, means dead center //
			// > 0 positive means below center //
			// < 0 negative means above center //

			// Normalise -1 to 1
			const	normalized = clamp(
				distanceFromCenter / (leftPaddle.height / 2),
				-1,
				1
			);
			// convert it to a ratio against paddle height //
			// divide by 2 is to create a ratio -1, 0 , 1 //

			// Increase speed
			const	speed = Math.min(
				Math.hypot(ball.vx, ball.vy) * BALL_SPEEDUP,
				BALL_MAX_SPEED
			);
			// wants to use the min of the changes in ball speed vs max ball speed which you capped it //
			// uses pythgoras to get the hypothenus which is the actual speed of the velocity vector //
			// hypot helps u get current speed * changes in speed //

			// Bounce right
			ball.vx = Math.abs(speed); 
			// get the absolute speed value direction can be adjusted in front of it //
			
			ball.vy = normalized * speed;
			// increases the speed of y as well // 
			
			// apply these 2 speed increases for uniformity for ball //
			// to prevent inconsistency of physics //

			// Push ball out to avoid sticking
			ball.x = leftPaddle.x + leftPaddle.width + ball.radius;
		}

		// if ball going right && collison with right paddle //
		if (ball.vx > 0 && hitPaddle(rightPaddle, ball))
		{
			console.log("Hit RIGHT paddle");
			const	paddleCenter = rightPaddle.y + rightPaddle.height / 2;
			// actual center of paddle //
			
			const	distanceFromCenter = ball.y - paddleCenter;
			// if == 0, means dead center //
			// if > 0 positive means below center //
			// if < 0 negative means above center //
			
			const	normalized = clamp(
				distanceFromCenter / (rightPaddle.height / 2),
				-1,
				1
			);
			// distanceFromCenter is in pixels //
			// convert it to a ratio against paddle height //
			// limits it to -1, 0, 1 //

			const	speed = Math.min(
				Math.hypot(ball.vx, ball.vy) * BALL_SPEEDUP,
				BALL_MAX_SPEED
			);
			// using pythgoras theory to find the actuall speed of ball //
			// apply the speed with increases by BALL_SPEEDUP //
			// get the min value of both the increased speed, and max ball speed //

			// Bounce left 
			ball.vx = -Math.abs(speed);
			// get the absolute value of speed. can adjust the direction accordingly //
			
			ball.vy = normalized * speed;
			// adjust vy speed as well //
			
			// apply these 2 speed increases for uniformity for ball //
			// to prevent inconsistency of physics //

			// push ball out to avoid sticking //
			ball.x = rightPaddle.x - ball.radius; 
		}
		
		// scoring scenario //
		if (ball.x + ball.radius < 0 || ball.x - ball.radius > width) // edge of ball touch canvas //
		{
			if (ball.x + ball.radius < 0) // if it exits on left side //
			{
				rightScore++;	// right side scores //
				if (rightScore >= MAX_SCORE)
					gameOver = true;	// if more than or equal 8 points //
				serveBallWithDelay(ball, width, height, 1, onPause, onResume); 
				// reset the ball status and set a delay timer before it restarts //
				return;
			}
			if (ball.x - ball.radius > width)	// if it exits on right side //
			{
				leftScore++;	// left side scores //
				if (leftScore >= MAX_SCORE)
					gameOver = true;	// if more than or equal 8 points //
				serveBallWithDelay(ball, width, height, -1, onPause, onResume);
				// reset the ball status and set a delay timer before it restarts //
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
		if (!isPaused()) // if game is not paused //
			update();	// update the game accordingly //
		
		render();	// frame by frame movements //

		if (isPaused())	// if game is paused //
			drawPausedOverlay(ctx, pauseMessage || "PAUSED", width, height); // 

		requestAnimationFrame(loop); // repeat the loop // 
	};

	console.log("Paddles drawn:", { leftPaddle, rightPaddle });
	loop();
});
