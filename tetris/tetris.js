/// https://codepen.io/anon/pen/wyGXZL
/// https://codepen.io/akm2/pen/rHIsa?editors=0010
/// https://codepen.io/ge1doot/pen/GQobbq?editors=0010
/// https://codepen.io/ykob/pen/YewoRz

/// https://www.youtube.com/watch?v=Z3wvP27eW98

// http://tetris.wikia.com/wiki/Tetris_Guideline
// see also https://harddrop.com/wiki/Tetris_Worlds#
/// todo: ghost piece
/// speed/points: http://tetris.wikia.com/wiki/Tetris_Worlds
/// random pieces: http://tetris.wikia.com/wiki/Random_Generator
/// Gamepad Support with DAS (Delayed Auto shift) and "real" DSA for keyboard (os independent) http://tetris.wikia.com/wiki/DAS
/// scoring system : http://tetris.wikia.com/wiki/Scoring#Guideline_scoring_system
/// drop time / gravity curve by level: http://tetris.wikia.com/wiki/Tetris_Worlds#Gravity

function drop_time(level)
{
	// http://tetris.wikia.com/wiki/Tetris_Worlds#Gravity
	// starting at level 1
	return Math.pow(0.8-((level-1)*0.007), level-1)
}

const canvas = document.getElementById('tetris')
const context = canvas.getContext('2d')

var audio = new Audio('clear.mp3');
var audio_drop = new Audio('drop.mp3');
var audio_dit = new Audio('dit.mp3');
var audio_turn = new Audio('turn.mp3');
context.scale(2,2);

function createPiece(type) {
	if(type === 'T')
	{
		return [
		[0, 0, 0],
		[1, 1, 1],
		[0, 1, 0] ];
	}
	else if(type === 'O')
	{
		return [
		[1, 1],
		[1, 1] ];
	}
	else if(type === 'L')
	{
		return [
		[0, 1, 0],
		[0, 1, 0],
		[0, 1, 1] ];
	}
	else if(type === 'J')
	{
		return [
		[0, 1, 0],
		[0, 1, 0],
		[1, 1, 0] ];
	}
	else if(type === 'S')
	{
		return [
		[0, 1, 1],
		[1, 1, 0],
		[0, 0, 0] ];
	}
	else if(type === 'Z')
	{
		return [
		[1, 1, 0],
		[0, 1, 1],
		[0, 0, 0] ];
	}
	else if(type === 'I')
	{
		return [
		[0, 1, 0, 0],
		[0, 1, 0, 0],
		[0, 1, 0, 0],
		[0, 1, 0, 0] ];
	}
}
function createColorPiece( piece )
{
	m = createPiece ( piece );
	for(let y=0; y<m.length; y++)
	{
		for(let x=0; x<m[y].length; x++)
		{
			if(m[y][x] !== 0)
				m[y][x] = piece;
		}
	}
	return m;
}

function int_random(from, to_exclusive)
{
	return ( (to_exclusive-from) * Math.random() | 0) + from;
}

function shuffle_arr( arr )
{
	for(let i=0; i<arr.length-1; i++)
	{
		const r = int_random(i, arr.length);
		const t = arr[i];
		arr[i] = arr[r];
		arr[r] = t;
	}
	return arr;
}

function collide(arena, player)
{
	const [m, o] = [player.matrix, player.pos]
	for (let y = 0; y < m.length; ++y)
	{
		for (let x = 0; x < m[y].length; ++x)
		{
			if( m[y][x] !== 0 &&
				(arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0)
			{
				return true;
			}
		}
	}
	return false;
}

function createMatrix(w, h)
{
	const matrix = [];
	while(h--)
	{
		matrix.push(new Array(w).fill(0))
	}
	return matrix;
}

function draw()
{
	context.fillStyle = 'white'
	context.fillRect(120, 0, 100, 200)

	context.fillStyle = '#000'
	context.fillRect(0, 0, 120, 200)

	context.strokeStyle="#FF0000";
	context.lineWidth = 0.1;
	context.beginPath()
	context.rect(130,40, 30,40);
	context.stroke();
	context.fillRect(130, 40, 30, 40)

	context.font = "10px Arial";
	context.fillText( player.points + " Points", 130, 190);
	context.fillText( Math.round(1000/deltaTime, 1) + " FPS", 130, 110);
	context.fillText( player.total_cleared_lines + " lines", 130, 170);
	context.fillText( "Lvl " + player.level, 130, 150);

	drawMatrix(player.matrix, player.pos, 10);
	drawMatrix(player.matrix, player.GhostPos(), 10, true);
	drawMatrix(arena, {x: 0, y:0}, 10);
	drawMatrix(player.next_piece, {x:13, y:4}, 10)
}

function drawMatrix(matrix, offset, scale, as_ghost=false) {
	context.lineWidth = 0.2;
	if(as_ghost)
	{
		context.strokeStyle="#FFFFFF";
	}
	else{
		context.strokeStyle="#000000";
	}
	matrix.forEach( (row, y) => {
		row.forEach( (value, x) => {
			if (value !== 0) {
				if(as_ghost)
				{
					context.beginPath()
					context.rect( (x + offset.x)*scale, (y + offset.y)*scale, scale, scale);
					context.stroke();
				}
				else
				{
					const colors = { I:'cyan', O:'yellow', T:'purple', S:'green', Z:'red', J:'blue', L:'orange'};
					context.fillStyle = colors[value];
					context.fillRect( (x + offset.x)*scale, (y + offset.y)*scale, scale, scale);
					context.beginPath()
					context.rect( (x + offset.x)*scale, (y + offset.y)*scale, scale, scale);
					context.stroke();
				}
			}
		});
	} );
}

function merge(arena, player)
{
	player.matrix.forEach( (row, y) => {
		row.forEach( (val, x) => {
			if(val !== 0)
			{
				arena[y + player.pos.y][x + player.pos.x] = val;
			}
		});
	});
	// console.table(arena);
}

function get_points(cleared_lines, level)
{
	// original nintendo scoring system http://tetris.wikia.com/wiki/Scoring#Original_Nintendo_Scoring_System
	// const points_per_lines = [40, 100, 300, 1200]

	// guideline scoring system http://tetris.wikia.com/wiki/Scoring#Guideline_scoring_system
	const points_per_lines = [100, 300, 500, 800]

	return (player.level) * points_per_lines[cleared_lines]
}

function clear_lines(arena)
{
	let cleared_lines = 0;
	for( let y = arena.length-1; y>=0; y--)
	{
		all_set = true;
		arena[y].forEach( (val, x) => {
			if(val === 0)
			{
				all_set = false;
			}
		});
		if(all_set)
		{
			cleared_lines++;
			for( let y2 = y; y2>0; y2--)
				arena[y2] = arena[y2-1];
			arena[0] = new Array(arena[0].length).fill(0);
			y++;
		}
	}
	if( cleared_lines > 0 )
	{
		audio.play();
		player.points += get_points( cleared_lines, player.level )
		player.total_cleared_lines += cleared_lines
		player.level = 1 + (player.total_cleared_lines/10 | 0)
	}
}

function rotate(matrix, dir)
{
	for(let y = 0; y < matrix.length; ++y) {
		for(let x = 0; x < y; ++x) {
			[ matrix[x][y], matrix[y][x] ]
			= [ matrix[y][x], matrix[x][y] ];
		}
	}

	if( dir > 0)
	{
		matrix.forEach( row => row.reverse() );
	} else {
		matrix.reverse();
	}
}
let deltaTime = 0;
let lastTime = 0;
let is_pause = false;
function update(time = 0) {
	gamepad.poll(time);
	if(!is_pause)
	{
		deltaTime = time - lastTime;
		lastTime = time;
		player.Update(deltaTime);
		play_song2(time);
	}
	draw();

	requestAnimationFrame(update);
}

function save_state()
{
	console.log(JSON.stringify(arena))
	console.log(JSON.stringify(player))
}

function from_backup(dest, src)
{
	for (var key in src) {
	    if (src.hasOwnProperty(key)) {
	        dest[key] = src[key];
	    }
	}
}

arena = createMatrix(12, 20);
player = new Player();

// arena = [[0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0],["purple",0,0,0,0,0,0,0,0,"red","yellow","yellow"],["purple","purple",0,"blue","blue","cyan","yellow","yellow","red","red","yellow","yellow"],["purple","orange","orange","blue","purple","cyan","yellow","yellow","red","cyan","green",0],["cyan","green",0,"blue","orange","orange","green","yellow","yellow","red","red","green"],["cyan","green","green",0,"purple","orange","green","green","orange","orange","red","red"],["cyan","red","yellow","yellow","orange",0,"blue","green","green","purple","purple","cyan"],["red","yellow","yellow","orange","orange","blue","blue","cyan","blue","green",0,"cyan"],["purple","purple","red","yellow","yellow","orange",0,"cyan","blue","green","green","cyan"],["purple","purple","purple","yellow","yellow","orange","orange","blue","blue",0,"green","cyan"]]
// from_backup(player, {"pos":{"x":10,"y":12},"matrix":[["yellow","yellow",0],["yellow","yellow",0],[0,0,0]],"points":2600,"level":1,"piece_bag":[[[0,0,0],["purple","purple","purple"],[0,"purple",0]],[[0,"green","green"],["green","green",0],[0,0,0]],[[0,"orange",0],[0,"orange",0],[0,"orange","orange"]],[["red","red",0],[0,"red","red"],[0,0,0]],[[0,"cyan",0,0],[0,"cyan",0,0],[0,"cyan",0,0],[0,"cyan",0,0]]],"next_piece":[[0,"blue",0],[0,"blue",0],["blue","blue",0]],"dropCounter":216.69699999620207,"total_cleared_lines":9})

gamepad = new GamepadController(document);
gamepad.addListener( [ KeyCodes.get("x"), [0, GamePadCode.BUTTON_RIGHT]], 1000, 1000, (button) => { player.Rotate(-1); } );

gamepad.addListener( [ KeyCodes.UP, KeyCodes.get("z"), KeyCodes.get("y"),
					  [0, GamePadCode.BUTTON_DOWN]], 1000, 1000, (button) => { player.Rotate(+1); } );

gamepad.addListener( [ KeyCodes.DOWN, [0, GamePadCode.DOWN]], 50, 30, (button) => { player.Drop(); } );

gamepad.addListener( [ KeyCodes.LEFT, [0, GamePadCode.LEFT]], 400, 50, (button) => { player.Move(-1); } );

gamepad.addListener( [ KeyCodes.RIGHT, [0, GamePadCode.RIGHT]], 400, 50, (button) => { player.Move(1); } );

gamepad.addListener( [ KeyCodes.SPACE, [0, GamePadCode.UP] ], 400, 50, (button) => { player.HardDrop(); } );
gamepad.addListener( [ KeyCodes.get("p") ], 1000, 1000, (button) => {player.pause(); } );
// gamepad.addListener( [ KeyCodes.get("w") ], 1000, 1000, (button) => {player.level++; } );



player.Reset();
update();
