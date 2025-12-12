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

	let		leftScore = 0;		// left scoreboard //
	let		rightScore = 0;		// right scoreboard //
	const	MAX_SCORE = 8;			// Max score before game ends //
	let		gameOver = false;	// gameOver flag //
	
	// Paddle Constants
	const	PADDLE_WIDTH = 20;
	const	PADDLE_HEIGHT = 100;
	const	PADDLE_MARGIN = 40;
	const	PADDLE_SPEED = 6;
	
	// Ball Constants
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

	// Drawing Helpers
	const	drawBackground = () =>
	{
		// Background color
		ctx.fillStyle = "black";
		ctx.fillRect(0, 0, width, height);

		// Center dashed line
		ctx.strokeStyle = "gray";	// pen color //
		ctx.setLineDash([10, 10]);	// dashLength, gapLength //
		ctx.beginPath();		// lift pen, start a new drawing //
		ctx.moveTo(width / 2, 0);	// move pen without drawing //
		ctx.lineTo(width / 2, height);	// draw a line to this point //
		ctx.stroke();			// actually draw the path //
		ctx.setLineDash([]);		// reset to solid //
	};

	const	drawPaddle = (p: Paddle) =>
	{
		ctx.fillStyle = p.color;
		ctx.fillRect(p.x, p.y, p.width, p.height);
	};
	
	const	drawBall = () =>
	{
		ctx.beginPath();		// lift pen, start a new drawing //
		ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI *2);	// draw the circle //
		ctx.fillStyle = ball.color;	// colour of ball //
		ctx.fill();			// fill into the canvas //
		ctx.closePath();		// put pen down //
	};

	const	drawScore = () =>
	{
		ctx.font = "32px Arial";	// Font size and type //
		ctx.fillStyle = "white";	// Text Color //
		ctx.textAlign = "center";	// x and y position I give you should be the center of the text, not the left edge //

		ctx.fillText(leftScore.toString(), width / 4, 50);	// canvas only draw strings //
		ctx.fillText(rightScore.toString(), (width * 3) / 4, 50); // canvas only draw strings //
	};

	const	drawGameOver = () =>
	{
		ctx.fillStyle = "white;"	// Text Color //
		ctx.font = "48px Arial";	// Font size and type //
		ctx.textAlign = "center";	// x and y position I give you should be the center of the text //

		ctx.fillText("GAME OVER", width / 2, height / 2 - 20); // Position where you put it //
		let	winnerText = "";
		if (leftScore > rightScore)
			winnerText = "Left Player Wins!";
		else if (rightScore > leftScore)
			winnerText = "Right Player Wins!";
		ctx.font = "32px Arial";
		ctx.fillText(winnerText, width / 2, height / 2 + 30); // Position where you put it //
	};

	//Input handling (keyboard)
	let keys:       Record<string, boolean> = {};	// creating a map //

	document.addEventListener("keydown", (e) =>	// e = keyboard event, keydown means you press a key //
	{
		keys[e.key] = true;	// e.key = string name of the key //
	});

	document.addEventListener("keyup", (e) =>	// e = keyboard event, keyup means you release the key //
	{
		keys[e.key] = false;	// e.key = string name of the key //
	});

	//Small helper to keep values inside a range
	const	clamp = (value: number, min: number, max: number): number => // if value too small, use min, if value too big, use max, otherwise keep the value as it is //
	{
		return Math.max(min, Math.min(max, value));	// keep the values within the limits of the canvas //
		// give me the smaller value of max, value first //
		// then give me the max value of min, result of the first operation //
	};

	const	hitPaddle = (p: Paddle): boolean =>	// ball collison function. Is the ball currently overlapping the paddle ? // 
	{
			const	paddleLeft = p.x;		// turns paddle into rectangle //
			const	paddleRight = p.x + p.width;
			const	paddleTop = p.y;
			const	paddleBottom = p.y + p.height;

			const	ballLeft = ball.x - ball.radius; // turns ball into rectangle //
			const	ballRight = ball.x + ball.radius;
			const	ballTop = ball.y - ball.radius;
			const	ballBottom = ball.y + ball.radius;

			const	overlapX = ballRight > paddleLeft && ballLeft < paddleRight; // does the ball overlap the paddle horizontally ? //
			const 	overlapY = ballBottom > paddleTop && ballTop < paddleBottom; // does the ball overlap the paddle vertically ? //

			return overlapX && overlapY; // both must overlap for collison to occur //
	};

	const	resetBall = (direction: 1 | -1) => // After someone scores, how to put it back into the center ? //
	// direction can only be 1 or -1 //
	// 1 = right //
	// -1 = left //
	{
		ball.x = width / 2;	// reset x-axis to center //
		ball.y = height /2;	// reset y-axis to center //
		ball.vx = direction * Math.abs(ball.vx); // Give me ball speed, but forget ball direction //
	};

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
		
		// out of bounds scenario	
		if (ball.x + ball.radius < 0 || ball.x - ball.radius > width) // edge of ball touch canvas //
		{
			if (ball.x + ball.radius < 0) // if it exits on left side //
			{
				rightScore++;	// right side scores //
				if (rightScore >= MAX_SCORE)
					gameOver = true;	// if more than or equal 8 points //
				resetBall(1);	// send the ball towards the right //
				return;
			}
			if (ball.x - ball.radius > width)	// if it exits on right side //
			{
				leftScore++;	// left side scores //
				if (leftScore >= MAX_SCORE)
					gameOver = true;	// if more than or equal 8 points //
				resetBall(-1);	// send the ball towards the left //
				return;
			}
		}
		
		// if ball going left && collison with left paddle //
		if (ball.vx < 0 && hitPaddle(leftPaddle)) 
		{
			console.log("Hit LEFT paddle");
			ball.vx *= -1; // bounce to the right //
			ball.x = leftPaddle.x + leftPaddle.width + ball.radius; // nudge out of paddle. This is to prevent the ball being stuck in the rectangle //
		}

		// if ball going right && collison with right paddle //
		if (ball.vx > 0 && hitPaddle(rightPaddle))
		{
			console.log("Hit RIGHT paddle");
			ball.vx *= -1; // bounce to the left //
			ball.x = rightPaddle.x - ball.radius; // nudge of out paddle. This is to prevent the ball being stuck in the rectangle //
		}
	};

	//One frame render
	const	render = () =>
	{
		drawBackground(); // draw background first //
		drawScore();	// draw score //
		drawPaddle(leftPaddle); // draw leftPaddle //
		drawPaddle(rightPaddle); // draw rightPaddle //
		drawBall();	// draw ball //
	};

	// Main loop
	const loop = () =>
	{
		if (gameOver) // if point more than MAXSCORE //
		{
			render(); 
			drawGameOver(); // draw game over scenatio //
			return;
		}
		update();	// updating game //
		render();
		requestAnimationFrame(loop); // keeps calling the game until condition is met //
	};

	console.log("Paddles drawn:", { leftPaddle, rightPaddle });
	loop();
});
