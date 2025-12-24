After types are declared, you probably need to determine which values are Fixed.
Game score fix it to determine winning condition

Paddle width, height is needed to draw the rectangluar shape of the paddle.
Paddle speed is needed to move the thing up and down every frame.
Paddle margin is used to determine its distance away from your left and right most limits.

Ball radius used to draw the shape of ball
Ball speed used to move the ball when game starts
Ball_speedup used for successful collison with paddle (add on)
Ball_max_speed makes the gameplay long enough that it still can be playable. 

Serve_delay_ms used to help everyone stabilise before the game resumes after a goal has been scored.

// Constant.ts first //
// Scoreboard //	// winning condition //
export const	MAX_SCORE = 8;

// Paddle Constants	// Paddle configuration //
export const	PADDLE_WIDTH = 20;
export const	PADDLE_HEIGHT = 100;
export const	PADDLE_MARGIN = 40;
export const	PADDLE_SPEED = 6;

// Ball Constants	// Ball configuration //
export const	BALL_RADIUS = 10;
export const	BALL_SPEED = 5;
export const	BALL_SPEEDUP = 1.06;
export const	BALL_MAX_SPEED = 14;

// Pause after score
export const	SERVE_DELAY_MS = 1000; // 1000 ms = 1 sec //
