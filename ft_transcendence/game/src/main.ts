import type { Paddle, Ball } from "./types.js";
import {
	MAX_SCORE,
	PADDLE_WIDTH, PADDLE_HEIGHT, PADDLE_MARGIN, PADDLE_SPEED,
	BALL_RADIUS, BALL_SPEED, BALL_SPEEDUP, BALL_MAX_SPEED,
} from "./constants.js";

import { clamp, hitPaddle, serveBallWithDelay } from "./physics.js";
import {
	drawBackground, drawPaddle, drawBall, drawScore, drawGameOver, drawPausedOverlay
} from "./render.js";

const ALLOW_TOKEN_IN_URL = true;

function getToken(): string | null {
  return sessionStorage.getItem("token") ?? localStorage.getItem("token"); // wherever you store JWT from /auth/login
}

function makeWsUrl(): string {
  const token = getToken();
  const proto = window.location.protocol === "https:" ? "wss" : "ws";
  const host = window.location.hostname; // e.g. localhost
  const wsHost = `${proto}://${host}:3000/ws/game`;
  return token ? `${wsHost}?token=${encodeURIComponent(token)}` : wsHost;
}

// Run this after the HTML is loaded
window.addEventListener("DOMContentLoaded", () => {
	if (ALLOW_TOKEN_IN_URL) {
	  const tokenFromUrl = new URLSearchParams(location.search).get("token");
	  if (tokenFromUrl) {
  	    sessionStorage.setItem("token", tokenFromUrl);
 	  }
 	}
	
        let matched = false;
	let gameOver = false;
	let youAre: "P1" | "P2" | null = null;
	
	// single player state //
	let pausedManual = false;
	let pausedAuto = false;
	let pauseMessage = "";
	
	let serving = false;
	let serveText = "";
	
	// server UI state
	let serverUserPaused = false;
	let serverPaused = false;
	let serverPauseMessage = "";
	
	// authoritative state from server
	let serverBall: Ball | null = null;
	let serverP1Y = 0;
	let serverP2Y = 0;
	let serverScoreL = 0;
	let serverScoreR = 0;
	
	const wsUrl = makeWsUrl();
	console.log("WS URL:", wsUrl);
	const ws = new WebSocket(wsUrl);
	
	let joinSent = false;
	let joinTimer: number | undefined;
	
	function scheduleJoinFallback(ms: number) {
	  if (joinTimer)
	    window.clearTimeout(joinTimer);
	  joinTimer = window.setTimeout(() => {
	    if (!matched && !joinSent && ws.readyState === WebSocket.OPEN) {
	      joinSent = true;
	      ws.send(JSON.stringify({ type: "queue:join" }));
	    }
	  }, ms);
	}
	
	function sendInput(dir: "up" | "down", pressed: boolean) {
	  if (!matched)
	    return;
	  if (!youAre)
	    return;
	  if (ws.readyState !== WebSocket.OPEN)
	    return;
	  ws.send(JSON.stringify({ type: "game:input", dir, pressed }));
	}
	
	ws.onopen = () => {
	  console.log("WS open");
	  
	  matched = false;
	  youAre = null;
	  
	  joinSent = false;
	  if (joinTimer)
	    window.clearTimeout(joinTimer);
	  
	  ws.send(JSON.stringify({ type: "match:reconnect" }));
	  
	  scheduleJoinFallback(1200);
	};

	ws.onmessage = (e) => {
  	  const msg = JSON.parse(e.data);
  	  
  	  if (msg.type === "connected") {
  	    // Optional: log it, but don't do anything else
  	    console.log("WS connected (server ack)");
  	    return;
  	  }
  	  
  	  if (msg.type === "match:reconnect_denied") {
  	    console.log("Reconnect denied:", msg.reason);
  	    if (!matched && !joinSent && ws.readyState === WebSocket.OPEN) {
  	      joinSent = true;
  	      ws.send(JSON.stringify({ type: "queue:join" }));
  	    }
  	    return;
  	  }
  	  
  	  if (msg.type === "match:found") {
  	    matched = true;
  	    youAre = msg.youAre;
  	    
  	    if (joinTimer)
  	      window.clearTimeout(joinTimer);
  	    joinTimer = undefined;
  	    
  	    console.log("Matched:", msg);
  	    return;
	  }
	  
	  if (msg.type === "game:state") {
	    matched = true;
	    
	    serverPaused = !!msg.paused;
	    
	    // IMPORTANT:
	    // Use server message verbatim if provided.
	    // If paused but no message, keep previous or default "PAUSED".
	    if (typeof msg.pauseMessage === "string") {
	      // server explicitly told us the message
	      serverPauseMessage = msg.pauseMessage;
	    }
	    else if (!serverPaused) {
	      // unpaused -> clear message
	      serverPauseMessage = "";
	    }
	    else if (!serverPauseMessage) {
	      // paused but server didn't send message -> default only if we have nothing
	      serverPauseMessage = "PAUSED";
	    }
	    
	    if (!serverPaused) {
	      serverUserPaused = false;
	    }
	    
	    serverP1Y = msg.p1.y;
	    serverP2Y = msg.p2.y;
	    
	    serverScoreL = msg.score.p1;
	    serverScoreR = msg.score.p2;
	    
	    serverBall = {
	      x: msg.ball.x,
	      y: msg.ball.y,
	      radius: msg.ball.r,
	      color: "white",
	      vx: msg.ball.vx,
	      vy: msg.ball.vy,
	    };
	    
	    return;
	  }
	  
	  if (msg.type === "game:over") {
	    console.log("GAME OVER:", msg);
	    
	    // update authoritative scores from game:over payload
	    serverScoreL = msg.score.p1;
	    serverScoreR = msg.score.p2;
	    
	    // stop the client
	    gameOver = true;
	    
	    if (!serverPaused) {
	      serverUserPaused = false;
	    }
	    
	    return;
	  }
	};

	ws.onclose = () => console.log("WS close");
	ws.onerror = (err) => console.log("WS error", err);
	
	const	canvas = document.getElementById("pong") as HTMLCanvasElement | null;
	if (!canvas)
	{
		console.error("Canvas with id 'pong' not found");
		return;
	}

	const	ctx = canvas.getContext("2d");
	if (!ctx)
	{
		console.error("Could not get 2D context");
		return;
	}

	// Canvas dimensions
	const   width = canvas.width;
	const   height = canvas.height;
	
	serverP1Y = (height - PADDLE_HEIGHT) / 2;
	serverP2Y = (height - PADDLE_HEIGHT) / 2;
	
	let	leftScore = 0;
	let	rightScore = 0;
	
	// Left Paddle
	const	leftPaddle: Paddle = {
		x:		PADDLE_MARGIN,
		y:		(height - PADDLE_HEIGHT) / 2,
		width:	PADDLE_WIDTH,
		height: PADDLE_HEIGHT,
		color:	"white",
		speed:	PADDLE_SPEED,
	};

	// Right Paddle
	const	rightPaddle: Paddle = {
		x:		width - PADDLE_MARGIN - PADDLE_WIDTH,
		y:		(height - PADDLE_HEIGHT) / 2,
		width:	PADDLE_WIDTH,
		height:	PADDLE_HEIGHT,
		color:	"white",
		speed:	PADDLE_SPEED,
	};
	
	const ball: Ball = {
		x:		width / 2,
		y:		height / 2,
		radius:	BALL_RADIUS,
		color:	"white",
		vx:		BALL_SPEED, // start moving to right
		vy:		BALL_SPEED * 0.7, // slight diagonal
	};

	//Input handling (keyboard)
	let keys:       Record<string, boolean> = {};

	document.addEventListener("keydown", (e) => {
		keys[e.key] = true;
		// send inputs to server (only after match)
		if (youAre === "P1") {
		  if (e.key === "w" || e.key === "W")
		    sendInput("up", true);
		  if (e.key === "s" || e.key === "S")
		    sendInput("down", true);
		}
		else if (youAre === "P2") {
		  if (e.key === "ArrowUp")
		    sendInput("up", true);
		  if (e.key === "ArrowDown")
		    sendInput("down", true);
		}
		if ((e.key === "p" || e.key === "P") && !e.repeat)
		{
			// multi-player
			if (matched) {
			  serverUserPaused = !serverUserPaused;
			  if (ws.readyState === WebSocket.OPEN) {
			    ws.send(JSON.stringify({ type: "game:pause", paused: serverUserPaused }));
			  }
			  return;
			}
			
			// single player
			if (pausedAuto)
			{
				pausedAuto = false;
				if (!serving && !pausedManual)
				  pauseMessage = "";
				return;
			}
			else
			{
				pausedManual = !pausedManual;
				pauseMessage = pausedManual ? "PAUSED (P to resume)" : "";
			}
		}
	});

	document.addEventListener("keyup", (e) => {
		keys[e.key] = false;
		// send inputs to server (only after match)
		if (youAre === "P1") {
		  if (e.key === "w" || e.key === "W")
		    sendInput("up", false);
		  if (e.key === "s" || e.key === "S")
		    sendInput("down", false);
		}
		else if (youAre === "P2") {
		  if (e.key === "ArrowUp")
		    sendInput("up", false);
		  if (e.key === "ArrowDown")
		    sendInput("down", false);
		}
	});

	window.addEventListener("blur", () => {
		keys = {};
		if (matched) {
		  // pause the whole match
		  if (ws.readyState === WebSocket.OPEN) {
		    serverUserPaused = true;
		    ws.send(JSON.stringify({ type: "game:pause", paused: true }));
		  }
		  return;
		}
		
		// single-player fallback
		pausedAuto = true;
		pauseMessage = "PAUSED (press P to resume)";
	});

	window.addEventListener("focus", () => {
		keys = {};
		
		// matched game: server own pause state
		if (matched)
		  return;
		  
		if (!matched && pausedAuto && !pausedManual) {
		  pauseMessage = "PAUSED (press P to resume)";
		}
	});

	const onPause = (msg: string) =>
	{
		serving = true;
		serveText = msg;
	};

	const onResume = () =>
	{
		serving = false;
		serveText = "";
	};

	const	isPaused = () => (matched ? serverPaused : (pausedManual || pausedAuto || serving));

	// Update game state (movement)
	const	update = () => {
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

		// if ball going left
		if (ball.vx < 0 && hitPaddle(leftPaddle, ball))
		{
			console.log("Hit LEFT paddle");
			// where did the ball hit the paddle ? 
			const	paddleCenter = leftPaddle.y + leftPaddle.height / 2;
			const	distanceFromCenter = ball.y - paddleCenter;

			// Normalise -1 to 1
			const	normalized = clamp(
				distanceFromCenter / (leftPaddle.height / 2),
				-1,
				1
			);

			// Increase speed
			const	speed = Math.min(
				Math.hypot(ball.vx, ball.vy) * BALL_SPEEDUP,
				BALL_MAX_SPEED
			);

			// Bounce right
			ball.vx = Math.abs(speed);
			ball.vy = normalized * speed;

			// Push ball out to avoid sticking
			ball.x = leftPaddle.x + leftPaddle.width + ball.radius;
		}

		// if ball going right
		if (ball.vx > 0 && hitPaddle(rightPaddle, ball))
		{
			console.log("Hit RIGHT paddle");
			
			const	paddleCenter = rightPaddle.y + rightPaddle.height / 2;
			const	distanceFromCenter = ball.y - paddleCenter;
			const	normalized = clamp(
				distanceFromCenter / (rightPaddle.height / 2),
				-1,
				1
			);

			const	speed = Math.min(
				Math.hypot(ball.vx, ball.vy) * BALL_SPEEDUP,
				BALL_MAX_SPEED
			);

			// Bounce left 
			ball.vx = -Math.abs(speed);
			ball.vy = normalized * speed;

			ball.x = rightPaddle.x - ball.radius;
		}
		
		// out of bounds scenario	
		if (ball.x + ball.radius < 0 || ball.x - ball.radius > width)
		{
			const isPauseForTimer = () => (matched ? serverPaused : (pausedManual || pausedAuto));
			if (ball.x + ball.radius < 0)
			{
				rightScore++;
				if (rightScore >= MAX_SCORE)
					gameOver = true;
				serveBallWithDelay(ball, width, height, 1, onPause, onResume, isPauseForTimer);
				return;
			}
			if (ball.x - ball.radius > width)
			{
				leftScore++;
				if (leftScore >= MAX_SCORE)
					gameOver = true;
				serveBallWithDelay(ball, width, height, -1, onPause, onResume, isPauseForTimer);
				return;
			}
		}
	};

	//One frame render
	const	render = () =>
	{
		drawBackground(ctx, width, height);
		
		if (matched && serverBall) {
		  leftPaddle.y = serverP1Y;
		  rightPaddle.y = serverP2Y;
		
		  drawScore(ctx, serverScoreL, serverScoreR, width);
		  drawPaddle(ctx, leftPaddle);
		  drawPaddle(ctx, rightPaddle);
		  drawBall(ctx, serverBall);
		  return;
		}
		
		drawScore(ctx, leftScore, rightScore, width);
		drawPaddle(ctx, leftPaddle);
		drawPaddle(ctx, rightPaddle);
		drawBall(ctx, ball);
	};
	
	const overlayText = () => {
	  if (matched) {
	    if (!serverPaused)
	      return "";
	    return serverPauseMessage || "PAUSED";
	  }
		    
	  if (pausedManual || pausedAuto)
	    return pauseMessage || "PAUSED (press P to resume)";
	     
	  if (serving)
	    return serveText || "SERVING";
		    
	  return "";
	};

	// Main loop
	const loop = () =>
	{
		if (gameOver)
		{
			render();
			if (matched) {
			  drawGameOver(ctx, width, height, serverScoreL, serverScoreR);
			}
			else {
			  drawGameOver(ctx, width, height, leftScore, rightScore);
			}
			return;
		}

		if (!isPaused() && !matched)
			update();
		
		render();
		
		if (isPaused())
		  drawPausedOverlay(ctx, overlayText(), width, height);

		requestAnimationFrame(loop);
	};

	console.log("Paddles drawn:", { leftPaddle, rightPaddle });
	loop();
});
