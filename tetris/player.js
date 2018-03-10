class Player
{
	constructor() {
		this.pos = {x: 5, y: 5};
		this.matrix = createMatrix(3,3);
		this.points = 0;
		this.level = 1;
		this.piece_bag = []
		this.next_piece = this.GetRandomPiece();
		this.dropCounter = 0;
		this.total_cleared_lines = 0;
	}

	Update(dt)
	{
		this.dropCounter += dt;
		if( this.dropCounter > drop_time(this.level)*1000 )
			this.Drop();
	}

	// we're using a "bag" system for the random pieces like described here
	// http://tetris.wikia.com/wiki/Random_Generator . this will ensentially
	// put all 7 possible pieces (IOTSZJL) into a bag, shuffle it, then draw
	// from it. if bag is empty, create new bag. this ensures max distance of
	// 12 between any two same pieces.
	// see also http://tetris.wikia.com/wiki/Tetris_Guideline .
	GetRandomPiece()
	{
		if( this.piece_bag.length == 0)
		{
			let pieces = shuffle_arr( ['I', 'O', 'T', 'S', 'Z', 'J', 'L'] );
			for(let i=0; i<pieces.length; i++)
			{
				this.piece_bag.push( createColorPiece( pieces[i] ) );
			}
		}
		return this.piece_bag.shift()
	}

	Reset()
	{
		this.matrix = this.next_piece;
		this.pos.y = 0;
		this.pos.x = (arena[0].length / 2 | 0) - (this.matrix[0].length / 2 | 0);
		this.next_piece = this.GetRandomPiece()
	}

	Drop()
	{
		if(is_pause) return;
		this.pos.y++;
		if( collide(arena, this) )
		{
			//save_state();
			this.pos.y--;
			merge(arena, this);
			clear_lines(arena);
			audio_drop.play()
			this.Reset()
		}
		this.dropCounter = 0;
	}



	// http://tetris.wikia.com/wiki/Hard_Drop
	// drop down instantly until colliding with a piece
	HardDrop()
	{
		if(is_pause) return;
		let ghostpost = this.GhostPos();
		this.pos.y = ghostpost.y;
		this.Drop();
	}

	// calculate the x/y-position of the "ghost piece" = the position the current tetromino would fall to
	// http://tetris.wikia.com/wiki/Ghost_piece
	GhostPos()
	{
		let y_backup = this.pos.y;
		this.pos.y++;
		while( !collide(arena, this) )
			this.pos.y++;
		let ghostpos = { x: this.pos.x, y: this.pos.y-1 };
		this.pos.y = y_backup;
		return ghostpos;
	}

	// move in desired x-direction
	// if not possible (collision), move is reverted
	Move(dir)
	{
		if(is_pause) return;
		this.pos.x += dir;
		if(collide(arena, this))
		{
			// revert collision
			this.pos.x -= dir;
		}
		else
		{
			audio_dit.currentTime = 0;
			audio_dit.play()
		}
	}

	// try to rotate the piece. kick_x/y: before rotation, move piece in the direction
	// if rotation wasn't possible (collision), revert.
	TryRotate(dir, kick_x, kick_y)
	{
		this.pos.x += kick_x;
		this.pos.y += kick_y;
		rotate(this.matrix, dir);
		if(collide(arena, this))
		{
			// collision, revert kick and rotation
			this.pos.x -= kick_x;
			this.pos.y -= kick_y;
			rotate(this.matrix, -dir);
			return false;
		}
		else
			return true;
	}

	// Rotate a tetromino in the desired direction (if possible!)
	// normal rotation is very simple:
	// if( this.TryRotate(dir, 0, 0 ) ) { /* play rotate sound */ }
	// TryRotate will check if the piece can be rotate to the desired state without colliding
	// with other blocks in the ends position.
	// however, that means e.g. a 'I' piece can't rotate when on the very left or right side.
	// that's what "Wall-Kicks" are for http://tetris.wikia.com/wiki/Wall_kick :
	// we try to rotate in normal position, then in position x-1, then in position x+1
	// Tetris Guideline wallkicks are here http://tetris.wikia.com/wiki/SRS
	// but a lot more complicated (also y-kicks, dependning on rotation etc.)
	Rotate(dir)
	{
		if(is_pause) return;

		let kick_data = [ [0,0], [-1, 0], [1, 0], [-2, 0], [2, 0] ];
		for(let i=0; i<kick_data.length; i++)
		{
			if( this.TryRotate(dir, kick_data[i][0], kick_data[i][1] ) )
			{
				audio_turn.currentTime = 0;
				audio_turn.play();
				break;
			}
		}
	}
	pause()
	{
		console.log("PAUSE!")
		is_pause = !is_pause;
	}

}