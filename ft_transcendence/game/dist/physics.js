import { BALL_SPEED, SERVE_DELAY_MS } from "./constants";
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
const randomServeAngle = () => {
    const maxAngle = Math.PI / 6;
    return (Math.random() * 2 - 1) * maxAngle;
};
export const resetBall = (ball, width, height, direction) => {
    ball.x = width / 2;
    ball.y = height / 2;
    const angle = randomServeAngle();
    ball.vx = Math.cos(angle) * BALL_SPEED * direction;
    ball.vy = Math.sin(angle) * BALL_SPEED;
};
export const serveBallWithDelay = (ball, width, height, direction, onPause, onResume, delayMs = SERVE_DELAY_MS) => {
    resetBall(ball, width, height, direction);
    onPause(direction === 1 ? "RIGHT SERVES" : "LEFT SERVES");
    setTimeout(() => {
        onResume();
    }, SERVE_DELAY_MS);
};
