// Run this after the HTML is loaded
window.addEventListener("DOMContentLoaded", () => // () => same as function() Essentially you are saying Let DOMContentLoaded load up all the html elements first, once its done then we execute rest of code //
{
	console.log("Pong game created with TypeScript");

	const	canvas = document.getElementById("pong") as HTMLCanvasElement | null; //I'm telling typescript this is a canvas specific HTMLElement so its called HTMLCanvasElement. If not i cannot access getContext later. Might be Null as well if you cannot find the Id //
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

	// Now you need left paddle, right paddle, scoreboard, ball //
	// paddle is a rectangle, hence you need x , y , width, height //
	type Paddle =
	{
		x:      number; // x axis of paddle determines where it starts on the canvas //
	    y:      number;	// y axis of paddle to move it up and down //
	    width:  number;	// how wide it is for colllison detecion //
	    height: number;	// how tall it is for collison detection //
	    color:  string;	// color of paddle // 
		speed:	number; // how fast paddle moves //
	};
	
	type	Ball = 
	{
		x:		number; // horizontal position on canvas //
		y:		number; // vertical position on canvas //
		radius:	number;		// how big the circle is //
		color:	string;		// drawing colour //
		vx:		number;	// velocity on x-axis //
		vy:		number;	// velocity on y-axis //
	};

	let		leftScore = 0;
	let		rightScore = 0;
	const	MAX_SCORE = 8;
	let		gameOver = false;
	// Paddle Constants
	const	PADDLE_WIDTH = 20;
	const	PADDLE_HEIGHT = 100;
	const	PADDLE_MARGIN = 40;
	const	PADDLE_SPEED = 6;
	
	const	BALL_RADIUS = 10;
	const	BALL_SPEED = 5;

	// Left Paddle
	const	leftPaddle: Paddle = 
	{
		x:		PADDLE_MARGIN,
		y:		(height - PADDLE_HEIGHT) / 2,
		width:	PADDLE_WIDTH,
		height: PADDLE_HEIGHT,
		color:	"white",
		speed:	PADDLE_SPEED,
	};

	// Right Paddle
	const	rightPaddle: Paddle =
	{
		x:		width - PADDLE_MARGIN - PADDLE_WIDTH,
		y:		(height - PADDLE_HEIGHT) / 2,
		width:	PADDLE_WIDTH,
		height:	PADDLE_HEIGHT,
		color:	"white",
		speed:	PADDLE_SPEED,
	};
	
	const ball: Ball =
	{
		x:		width / 2,
		y:		height / 2,
		radius:	BALL_RADIUS,
		color:	"white",
		vx:		BALL_SPEED, // start moving to right
		vy:		BALL_SPEED * 0.7, // slight diagonal
	};

	// Drawing Helpers
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
	}

	const	drawGameOver = () =>
	{
		ctx.fillStyle = "white;"
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
	}

	//Input handling (keyboard)
	let keys:       Record<string, boolean> = {};

	document.addEventListener("keydown", (e) =>
	{
		keys[e.key] = true;
	});

	document.addEventListener("keyup", (e) =>
	{
		keys[e.key] = false;
	});

	//Small helper to keep values inside a range
	const	clamp = (value: number, min: number, max: number): number =>
	{
		return Math.max(min, Math.min(max, value));
	}

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
		ball.vx = direction * Math.abs(ball.vx);
	};

	// Update game state (movement)
	const	update = () =>
	{
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
		
		// out of bounds scenario	
		if (ball.x + ball.radius < 0 || ball.x - ball.radius > width)
		{
			if (ball.x + ball.radius < 0)
			{
				rightScore++;
				if (rightScore >= MAX_SCORE)
					gameOver = true;
				resetBall(1);
				return;
			}
			if (ball.x - ball.radius > width)
			{
				leftScore++;
				if (leftScore >= MAX_SCORE)
					gameOver = true;
				resetBall(-1);
				return;
			}
		}
		
		// if ball going left
		if (ball.vx < 0 && hitPaddle(leftPaddle))
		{
			console.log("Hit LEFT paddle");
			ball.vx *= -1; // bounce to the right
			ball.x = leftPaddle.x + leftPaddle.width + ball.radius; // nudge out of paddle
		}

		// if ball going right
		if (ball.vx > 0 && hitPaddle(rightPaddle))
		{
			console.log("Hit RIGHT paddle");
			ball.vx *= -1; // bounce to the left
			ball.x = rightPaddle.x - ball.radius; // nudge of out paddle 
		}
	};

	//One frame render
	const	render = () =>
	{
		drawBackground();
		drawScore();
		drawPaddle(leftPaddle);
		drawPaddle(rightPaddle);
		drawBall();
	};

	// Main loop
	const loop = () =>
	{
		if (gameOver)
		{
			render();
			drawGameOver();
			return;
		}
		update();
		render();
		requestAnimationFrame(loop);
	}

	console.log("Paddles drawn:", { leftPaddle, rightPaddle });
	loop();
});
