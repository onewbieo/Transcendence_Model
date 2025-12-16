import type { Paddle, Ball } from "./types";

export const drawBackground = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
	ctx.fillStyle = "black";
	ctx.fillRect(0, 0, width, height);

	ctx.strokeStyle = "gray";
	ctx.setLineDash([10, 10]);
	ctx.beginPath();
	ctx.moveTo(width / 2, 0);
	ctx.lineTo(width / 2, height);
	ctx.stroke();
	ctx.setLineDash([]);
};

export const	drawPaddle = (ctx: CanvasRenderingContext2D, p: Paddle) => {
	ctx.fillStyle = p.color;
	ctx.fillRect(p.x, p.y, p.width, p.height);
};

export const	drawBall = (ctx: CanvasRenderingContext2D, ball: Ball) => {
	ctx.beginPath();
	ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI *2);
	ctx.fillStyle = ball.color;
	ctx.fill();
	ctx.closePath();
};

export const	drawScore = (
	ctx: CanvasRenderingContext2D,
	leftScore:	number,
	rightScore:	number,
	width:		number
) => {
	ctx.font = "32px Arial";
	ctx.fillStyle = "white";
	ctx.textAlign = "center";
	ctx.fillText(leftScore.toString(), width / 4, 50);
	ctx.fillText(rightScore.toString(), (width * 3) / 4, 50);
};

export const	drawGameOver = (
	ctx:	CanvasRenderingContext2D,
	width:		number,
	height:		number,
	leftScore:	number,
	rightScore:	number
) => {
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

export const	drawPausedOverlay = (
	ctx:	CanvasRenderingContext2D,	
	msg:	string,
	width:	number,
	height:	number
) => {
	ctx.font = "32px Arial";
	ctx.fillStyle = "white";
	ctx.textAlign = "center";
	ctx.fillText(msg, width / 2, height / 2);
};
