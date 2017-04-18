$(document).ready(function () {

	var current_game = new GameOfLife($("#gameboard"),50,50,500,1,2,3,3,3,"always_dead");

	// HEY HEY HEY
	$("#new_button").click(function (e) {
		e.preventDefault();

		var width = parseInt($("#width_input").val());	
		if (isNaN(width) || width < 20 || width > 200) {
			alert("Illegal width: " + $("#width_input").val());
			return;
		}

		var height = parseInt($("#height_input").val());
		if (isNaN(height) || height < 20 || height > 200) {
			alert("Illegal height: " + $("#height_input").val());
			return;
		}

		var speed = parseInt($("#speed_input").val());
		if (isNaN(speed) || speed < 1 || speed > 1000) {
			alert("Illegal speed: " + $("#speed_input").val());
			return;
		}

		var r = parseInt($("#r_input").val());
		if (isNaN(r) || r < 1 || r > 10) {
			alert("Illegal r: " + $("#r_input").val());
			return;
		}
		var o = parseInt($("#o_input").val());
		if (isNaN(o) || o < 1 || o >= (4*r*r + 4*r)) {
			alert("Illegal o: " + $("#o_input").val());
			return;
		}	

		var l = parseInt($("#l_input").val());
		if (isNaN(l) || l < 1 || l > o) {
			alert("Illegal l: " + $("#l_input").val());
			return;
		}

		var gmax = parseInt($("#gmax_input").val());
		if (isNaN(gmax) || gmax < 1 || gmax >= (4*r*r + 4*r)) {
			alert("Illegal gmax: " + $("#gmax_input").val());
			return;
		}

		var gmin = parseInt($("#gmin_input").val());
		if (isNaN(gmin) || gmin < 1 || gmin > gmax) {
			alert("Illegal gmin: " + $("#gmin_input").val());
			return;
		}

		var perimeter = $("input:radio[name=perimeter]:checked").val();

		if (current_game != null) {
			current_game.kill();
		}

		$("#pause_button").text("Start");


		current_game = new GameOfLife($("#gameboard"), width, height, speed,r,l,o,gmin,gmax,perimeter);
	});

$("#step_button").click(function (e) {
	e.preventDefault();
	if (current_game != null) {
		current_game.step();
	}
});

$("#pause_button").click(function (e) {
	e.preventDefault();
	if (current_game != null) {
		current_game.pause();
	}
});

$("#clear_button").click(function (e) {
	e.preventDefault();
	if (current_game != null) {
		current_game.clear();
	}
});

$("#random_fill_button").click(function (e) {
	e.preventDefault();
	if (current_game != null) {
		current_game.randomFill();
	}
});
});


var GameOfLife = function(gameboard_div,width,height,speed,r,l,o,gmin,gmax,perimeter) {
	this.time = null;
	this.gameboard_div = gameboard_div;
	this.width = width;
	this.height = height;
	this.cell_count = width*height;
	this.paused = true;
	this.speed = speed;
	this.killed = false;
	this.gen = 0;
	this.r = r;
	this.l = l;
	this.o = o;
	this.gmin = gmin;
	this.gmax = gmax;
	this.perimeter = perimeter;



	this.cells = new Array(height);

	$("#generation").text("Generation: " + (this.gen).toString());


	gameboard_div.css({position: "relative", width: this.width * Cell.WIDTH, 
		height: this.height * Cell.HEIGHT});

	for (var y=0; y<this.height; y++) {
		this.cells[y] = new Array(width);
		for (var x=0; x<this.width; x++) {
			var cell = new Cell(this, x, y);
			this.cells[y][x] = cell;
			gameboard_div.append(cell.getCellDiv());
		}
	}   
};

GameOfLife.prototype.getCell = function(x,y) {
	if ((x < 0) || (x >= this.width) || (y < 0) || (y >= this.height)) {
		return null;
	}
	return this.cells[y][x];
}

GameOfLife.prototype.clear = function() {
	for (var w = 0; w < this.width; w++) {
		for (var h = 0; h<this.height; h++) {
			this.cells[w][h].reset();
		}
	}
}

GameOfLife.prototype.randomFill = function() {
	for (var w = 0; w < this.width; w++) {
		for (var h = 0; h<this.height; h++) {
			this.cells[w][h].die();
			// Bring to life about 1 out of every 10 cells (random)
			var rand = Math.floor((Math.random() * 100) + 1);
			if ((rand%10) == 0) {
				this.cells[w][h].live();
			}
		}
	}
}

GameOfLife.prototype.step = function() {
	for (var w = 0; w < this.width; w++) {
		for (var h = 0; h < this.height; h++) {
			current_cell = this.cells[h][w];
			current_cell.getNeighborInfo(this.r, this.perimeter, this.width,this.height);
			current_cell.updateNextState(this.l,this.o,this.gmin,this.gmax);
		}
	}
	for (var w = 0; w < this.width; w++) {
		for (var h = 0; h<this.height; h++) {
			this.cells[h][w].switchCellState();
		}
	}
	this.gen++;
	$("#generation").text("Generation: " + (this.gen).toString());
}

GameOfLife.prototype.go = function() {
	var stepper = this.step.bind(this);
	this.time = setInterval(stepper, this.speed);
}

GameOfLife.prototype.pause = function() {
	if (this.paused == true) {
		this.paused = false;
		$("#pause_button").text("Pause");
		this.go();
	} else {
		this.paused = true;
		$("#pause_button").text("Start");
		clearInterval(this.time);
	}
};

GameOfLife.prototype.kill = function () {
	if (this.killed) {
		return;
	}
	this.gameboard_div.empty();	
	clearInterval(this.time);

	this.killed = true;
};


var Cell = function (gameoflife,x, y) {
	this.gameoflife = gameoflife;
	this.x = x;
	this.y = y;
	this.alive = false;
	this.next_alive = false;
	this.was_alive = false;
	this.neighbor_count = 0;

	this.cell_div = $("<div></div>").css({position: "absolute",
		width: Cell.WIDTH,
		height: Cell.HEIGHT,
		top: y * Cell.HEIGHT,
		left: x * Cell.WIDTH});
	this.cell_div.addClass("cell");
	this.cell_div.addClass("dead");

	var cell = this;

	this.cell_div.on('mousedown', function (e) {
		e.preventDefault(); });

	this.cell_div.click(function (e) {
		e.preventDefault();

		if ((e.button == 0) && !e.shiftKey)  {
			cell.leftclick();
		} else if ((e.button == 1) || ((e.button == 0) && e.shiftKey)) {
			cell.shiftleftclick();
		} else if ((e.button == 0) && e.ctrllKey) {
			cell.controlleftclick();
		} else if((e.button == 0) && e.altlKey) {
			cell.controlleftclick();
		}
	});
};

Cell.WIDTH = 10;
Cell.HEIGHT = 10;

Cell.prototype.leftclick = function(recursed) {
	if (this.alive == false) {
		this.live();
	} else {
		this.die();
	}
}

Cell.prototype.shiftleftclick = function(recursed) {
	this.live();
}

Cell.prototype.controlleftclick = function(recursed) {
	this.die();
}

Cell.prototype.live = function() {
	if (this.alive == false) {
		if (this.was_alive == true) {
			this.cell_div.removeClass("was_alive");
		} else {
			this.cell_div.removeClass("dead");
		}
		this.cell_div.addClass("alive");
	}
	this.alive = true;
}

Cell.prototype.die = function() {
	if (this.alive == true) {
		this.cell_div.removeClass("alive");
		if (this.was_alive == true) {
			this.cell_div.addClass("was_alive");
		} else {
			this.cell_div.addClass("dead");
		}
	}
	this.alive = false;
}

Cell.prototype.reset = function() {
	if (this.was_alive == true) {
		this.cell_div.removeClass("was_alive");
	}
	if (this.alive == true) {
		this.cell_div.removeClass("alive");
	}
	this.cell_div.addClass("dead");
	this.alive = false;
	this.was_alive = false;
}
// Find the cell's neighbors, the number of alive neighbors
Cell.prototype.getNeighborInfo = function(radius,perimeter,width,height) {
	var nbrs = new Array();	
	this.neighbor_count = 0;

	for (var dx = (-1*radius); dx <= radius; dx++) {
		for (var dy = (-1*radius); dy <= radius; dy++) {
			if ((dx != 0) || (dy != 0)) {
				var tor_x = (this.x + dx).mod(width);
				var tor_y = (this.y + dy).mod(height);


				if (perimeter == "always_dead") {
					var n = this.gameoflife.getCell(this.x+dx, this.y+dy);
					if (n != null) {
						if (n.alive == true) {
							this.neighbor_count++;
						}
					}				
				} else if (perimeter == "always_alive" ) {
					var n = this.gameoflife.getCell(this.x+dx, this.y+dy);
						if (n == null) {
							this.neighbor_count++;

						} else {
							if (n.alive == true) {
								this.neighbor_count++;
							}
						}
						
				} else if (perimeter == "toroidal" ){
					var n = this.gameoflife.getCell(this.x+dx, this.y+dy);
					if (n != null) {
						if (n.alive == true) {
							this.neighbor_count++;
						}
					} else {
						var n = this.gameoflife.getCell(tor_x,tor_y);
						if (n != null ) {
							if (n.alive == true) {
								this.neighbor_count++;

							}
						}
					}
				} else {
					break;
				}
			}
		}
	}			
}

Cell.prototype.updateNextState = function(lone,over,gmin,gmax) {
	// change next alive
	var count = this.neighbor_count;
	if (count < lone && this.alive == true) {
		this.next_alive = false;
	} else if (count <= over && this.alive == true) {
		this.next_alive = true;
	} else if (count <= gmax && count >= gmin && this.alive == false) {
		this.next_alive = true;
	} else {
		this.next_alive = false;
	}
}

// Switches the state of cells previously set by updateNeighbors()
Cell.prototype.switchCellState = function() {
	if (this.next_alive == true) {
		this.live();
		this.was_alive = true;
	} else {
		if (this.alive == true) {
			this.was_alive = true;
		}
		this.die();
	}
};


Cell.prototype.getCellDiv = function() {
	return this.cell_div;
};

Number.prototype.mod = function(n) {
    return ((this%n)+n)%n;
};

