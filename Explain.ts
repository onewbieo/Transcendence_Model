What types of equipment do we need for this game ?
You need a Paddle and a Ball. 
So we start by defining types for these 2 items.

// Lets start with types.ts first //
export	type Paddle = { // export word is used so that you can use call it in different .js files. share the same definition and stay consistent. creating a Paddle type Can call many different objects after that //
	x:      number; // x position determines where it starts on the canvas //
	y:      number; // y position determines paddle movement up and down //
	width:  number;	// how wide is it //
	height: number;	// how high is it //
	color:  string;	// colour of the paddle //
	speed:	number;	// paddle movement speed //
};
	
export	type Ball = { // creating a ball type //
	x:		number;	// horizontal position on canvas //
	y:		number;	// vertical position on canvas //
	radius:	number;		// radius is needed to capture the whole ball //
	color:	string;		// ball colour //
	vx:		number; // horizontal speed of ball //
	vy:		number;	// vertical speed of ball //
};
