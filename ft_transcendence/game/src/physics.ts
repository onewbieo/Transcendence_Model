import type { Paddle, Ball } from "./types.js";
import { BALL_SPEED, SERVE_DELAY_MS } from "./constants.js";

export const clamp = (value: number, min: number, max: number): number =>
	Math.max(min, Math.min(max, value));
	
export const hitPaddle = (p: Paddle, ball: Ball): boolean => {
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

const randomServeAngle = (): number =>
{
	const maxAngle = Math.PI / 6;
	return (Math.random() * 2 - 1) * maxAngle;
};

export const	resetBall = (ball: Ball, width: number, height: number, direction: 1 | -1) => {
	ball.x = width / 2;
	ball.y = height /2;
	const angle = randomServeAngle();
	ball.vx = Math.cos(angle) * BALL_SPEED * direction;
	ball.vy = Math.sin(angle) * BALL_SPEED;
};

let serveTimer: ReturnType<typeof setTimeout> | null = null;

export const serveBallWithDelay = (
	ball: Ball,
	width: number,
	height: number,
	direction: 1 | -1,
	onPause: (msg: string) => void,   // function onPause(msg: string): void 
	onResume: () => void,
	isPaused?: () => boolean,
	delayMs: number = SERVE_DELAY_MS
) => {
	onPause(direction === 1 ? "RIGHT SERVES" : "LEFT SERVES");
	
	// freeze ball + center it during the countdown
	ball.x = width / 2;
	ball.y = height / 2;
	ball.vx = 0;
	ball.vy = 0;
	
	if (serveTimer) {
	  clearTimeout(serveTimer);
	  serveTimer = null;
	}
	
	let remaining = delayMs;
	let last = performance.now();
	
	const step = () => {
	  const now = performance.now();
	  
	  // if paused, dont consume remaining time
	  if (isPaused && isPaused()) {
	    last = now;
	    serveTimer = setTimeout(step, 16);
	    return;
	  }
	  
	  remaining -= now - last;
	  last = now;
	  
	  if (remaining <= 0) {
	    resetBall(ball, width, height, direction);
	    onResume();
	    serveTimer = null;
	    return;
	  }
	  serveTimer = setTimeout(step, 16);
	};  
	serveTimer = setTimeout(step, 16);
};
