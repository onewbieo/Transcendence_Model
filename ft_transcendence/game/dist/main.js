"use strict";
// Run this after the HTML is loaded
window.addEventListener("DOMContentLoaded", () => {
    console.log("Pong game created with TypeScript");
    const canvas = document.getElementById("pong");
    if (!canvas) {
        console.error("Canvas with id 'pong' not found");
        return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
        console.error("Could not get 2D context");
        return;
    }
    // Canvas dimensions
    const width = canvas.width;
    const height = canvas.height;
    // Paddle Constants
    const PADDLE_WIDTH = 15;
    const PADDLE_HEIGHT = 100;
    const PADDLE_MARGIN = 30;
    // Left Paddle
    const leftPaddle = {
        x: PADDLE_MARGIN,
        y: (height - PADDLE_HEIGHT) / 2,
        width: PADDLE_WIDTH,
        height: PADDLE_HEIGHT,
        color: "white",
    };
    // Right Paddle
    const rightPaddle = {
        x: width - PADDLE_MARGIN - PADDLE_WIDTH,
        y: (height - PADDLE_HEIGHT) / 2,
        width: PADDLE_WIDTH,
        height: PADDLE_HEIGHT,
        color: "white",
    };
    // Drawing Helpers
    const drawBackground = () => {
        ctx.fillStyle = "blue";
        ctx.fillRect(0, 0, width, height);
        // Center dashed line
        ctx.strokeStyle = "gray";
        ctx.setLineDash([10, 10]);
        ctx.beginPath();
        ctx.moveTo(width / 2, 0);
        ctx.lineTo(width / 2, height);
        ctx.stroke();
        ctx.setLineDash([]);
    };
    const drawPaddle = (p) => {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.width, p.height);
    };
    //Render
    const render = () => {
        drawBackground();
        drawPaddle(leftPaddle);
        drawPaddle(rightPaddle);
    };
    render();
    console.log("Paddles drawn:", { leftPaddle, rightPaddle });
});
