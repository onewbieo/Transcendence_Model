this is the part where you draw the background, paddles, ball, scoreboard, gameover message, pause message.

// render.ts //
import type { Paddle, Ball } from "./types.js"; // we needed the Paddle and Ball so we extract from that file // 

export const drawBackground = (ctx: CanvasRenderingContext2D, width: number, height: number) => { // CanvasRenderingContext2D is an object where canvas.getContext generates if valid.
// drawing the background of the canvas //
	// Background color //
	ctx.fillStyle = "black"; // color //
	ctx.fillRect(0, 0, width, height); // fills up the whole canvas coordinates with the colour every frame //

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
