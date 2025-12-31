export const drawBackground = (ctx, width, height) => {
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
export const drawPaddle = (ctx, p) => {
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.width, p.height);
};
export const drawBall = (ctx, ball) => {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = ball.color;
    ctx.fill();
    ctx.closePath();
};
export const drawScore = (ctx, leftScore, rightScore, width) => {
    ctx.font = "32px Arial";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.fillText(leftScore.toString(), width / 4, 50);
    ctx.fillText(rightScore.toString(), (width * 3) / 4, 50);
};
export const drawGameOver = (ctx, width, height, leftScore, rightScore, winner = null, youAre = null) => {
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    // Title 
    ctx.font = "48px Arial";
    ctx.fillText("GAME OVER", width / 2, height / 2 - 60);
    // Score
    ctx.font = "28px Arial";
    ctx.fillText(`Score: ${leftScore} - ${rightScore}`, width / 2, height / 2 - 15);
    // Winner: trust explicit winner first 
    let winnerText = "";
    if (winner === "P1")
        winnerText = "Left Player Wins!";
    else if (winner === "P2")
        winnerText = "Right Player Wins!";
    else {
        if (leftScore > rightScore)
            winnerText = "Left Player Wins!";
        else if (rightScore > leftScore)
            winnerText = "Right Player Wins!";
        else
            winnerText = "Draw";
    }
    ctx.font = "32px Arial";
    ctx.fillText(winnerText, width / 2, height / 2 + 35);
};
export const drawPausedOverlay = (ctx, msg, width, height) => {
    ctx.font = "32px Arial";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.fillText(msg, width / 2, height / 2);
};
