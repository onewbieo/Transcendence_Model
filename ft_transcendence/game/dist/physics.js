import { BALL_SPEED } from "./constants";
export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export const hitPaddle = (p, ball) => {
    const paddleLeft = p.x;
    const paddleRight = p.x + p.width;
    const paddleTop = p.y;
    const paddleBottom = p.y + p.height;
    const ballLeft = ball.x - ball.radius;
    const ballRight = ball.x + ball.radius;
    const ballTop = ball.y - ball.radius;
    const ballBottom = ball.y + ball.radius;
    const overlapX = ballRight > paddleLeft && ballLeft < paddleRight;
    const overlapY = ballBottom > paddleTop && ballTop < paddleBottom;
    return overlapX && overlapY;
};
export const resetBall = (ball, width, height, direction) => {
    ball.x = width / 2;
    ball.y = height / 2;
    ball.vx = direction * BALL_SPEED;
    ball.vy = BALL_SPEED * 0.7;
};
