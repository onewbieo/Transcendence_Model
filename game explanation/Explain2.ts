Now we talk about how the law of the game works.

clamp function is to keep the values from running out of bounds so that it doesnt go past the canvas boundaries and cause invalid rendering behavior. 

then we need to handle ball collison process with the paddle.
what is considered a successful collison and what is not. 

we adjust the serve angle (randomise it) after a goal has been scored (add on)
we also reset the ball back to its default condition as per the game has just started. (speed, position)

then we need to declare a function where it stops the game, sets a timer and resumes it. serveBallWithdelay.

// Physics.ts //
import type { Paddle, Ball } from "./types.js"; // we declare Paddle and ball Objects from types.js //
import { BALL_SPEED, SERVE_DELAY_MS } from "./constants.js"; // we needed BALL_SPEED and SERVE_DELAYS constants inside this function hence we import the variables over //

export const clamp = (value: number, min: number, max: number): number =>
	Math.max(min, Math.min(max, value)); // clamp is a function to keep value within the limits of the canvas // 
	// if value too small, use min, if value too big, use max, otherwise keep the value as it is //
	// give me the smaller value of max, value first //
	// then give me the max value of min, result of the first operation //
	// value represents something in that position. paddle.x, paddle.y, ball.x, ball.y where you want to keep it within the limits //
	
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

	return overlapX && overlapY; // using the AND operator here //
	// if both are true = collison //
	// if only one is true = no collison //
	// AABB collison, Axis-Aligned Bounding Box //
};

const randomServeAngle = (): number => // when serving, give a random angle //
{
	const maxAngle = Math.PI / 6; // 30 degree angle //
	return (Math.random() * 2 - 1) * maxAngle; // Math.random() gives a number between 0 inclusive and 1 exclusive //
	// based on that, your angle will be between -30 degrees and 30 degrees
	// 30 degrees is just right, not too steep //
};

export const	resetBall = (ball: Ball, width: number, height: number, direction: 1 | -1) => { 
	// so reset ball needed certain variables like Ball Object, width of canvas, height of canvas,	direction to face 1 = right -1 = left //
	ball.x = width / 2; //	center the ball //
	ball.y = height / 2; // center the ball //
	const angle = randomServeAngle(); // generate random angle //
	ball.vx = Math.cos(angle) * BALL_SPEED * direction; // cosine controls x direction and strength //
	ball.vy = Math.sin(angle) * BALL_SPEED; // sine controls y direction and strength //
};

export const serveBallWithDelay = (
	// doing 2 jobs here, reset the ball to the center and control the serve timing //
	ball: Ball,	// ball object //
	width: number,	// canvas width //
	height: number,	// canvas height //
	direction: 1 | -1, // direction 1 = right, -1 = left //
	onPause: (msg: string) => void, // pause the game and show text generic function takes from main function that takes a string message and returns void //
	onResume: () => void, // resume game. generic function takes from main function that takes no paramteters and returns void //
	delayMs: number = SERVE_DELAY_MS // use this to capture the time delay //
) => {
	if (direction === 1)
		onPause("RIGHT SERVES"); // based on which direction while pausing, display message //
	else
		onPause("LEFT SERVES"); // based on which direction while pausing, display message //
	resetBall(ball, width, height, direction); // resetting the ball //
	
	setTimeout(() => // delay by delayMs and run the code inside //
	{
		onResume(); // resumption of game //
	}, delayMs);
};
