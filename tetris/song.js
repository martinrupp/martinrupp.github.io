function create_src(audioContext, volume, attack, decay, frequency, t, length_s)
{
	let gain = audioContext.createGain();

	gain.gain.setValueAtTime(0, t);
	gain.gain.linearRampToValueAtTime(volume, t + attack);
	gain.gain.setValueAtTime(volume, t+length_s - decay);
	gain.gain.linearRampToValueAtTime(0.0, t+length_s);

	let myOscillator = audioContext.createOscillator();
	myOscillator.frequency.setValueAtTime(frequency, t);

	myOscillator.connect(gain);
	myOscillator.start(t);
	// necessary, otherwise doesn't work anymore after some time!
	// (propably due to garbage collection / limited nr of channels)
	myOscillator.stop(t+length_s);

	gain.connect(audioContext.destination);
	return myOscillator;
}

function get_0based_note(note)
{
	let mapping = {
		"c":0, "d": 2, "e": 4, "f":5, "g":7, "a":9, "h":11
	};
	n =mapping[note.charAt(0)]
	if(note.length > 1 && node.charAt(1) == '#' )
		n++;
	if(note.length > 1 && node.charAt(1) == 'b' )
		n--;
	return n;
}
function get_note_frequency(note, octave)
{
	let base_tone_A = 440;
	let base_tone_shift_to_C = 3;
	return base_tone_A/8 * Math.pow(2, (octave*12+get_0based_note(note)+base_tone_shift_to_C)*1/12);
}

/// song structure is [[note0, length0, octave0], [note1, length1, octave1], ...]
/// to not repeat ourselfs so much, length and octave don't HAVE to be entered all the time.
/// if octave is not present, the octave is set so that the note is as near as possible
/// to the previous note.
/// if length is not present, the length of the previous note is taken
/// e.g ["c", 1, 4], ["d"]  ->  ["c", 4], ["d", 1, 4]
/// but also ["c", 1, 4], ["h"]  --> ["c", 1, 4], ["h", 1, 3]
/// this function "uncompresses" the song, i.e. adding the ommitted values again.
function uncompress_song(song)
{
	for(let i=0; i<song.length; i++)
	{
		if(song[i].length < 2)
		{
			// use previous note length if not present
			song[i][1] = song[i-1][1]
		}

		if(song[i].length < 3)
		{
			if( i == 0 )
			{
				// not previous octave: set to 3
				song[i][2] = 3;
			}
			else
			{
				// check which octave is closer
				let n0 = get_0based_note(song[i-1][0])
				let n1 = get_0based_note(song[i][0])
				if( Math.abs(n1-n0) > 6 )
				{
					if(n1 > n0)
					{
						// octave down (e.g. c -> a)
						song[i][2] = song[i-1][2]-1
					}
					else
					{
						// octave up (e.g. h -> d)
						song[i][2] = song[i-1][2]+1
					}
				}
				else
				{
					// stay in previous octave
					song[i][2] = song[i-1][2]
				}
			}
		}
	}
}

function play_song(t, audioContext, song, config)
{
	uncompress_song( song );
	let volume = config.volume;
	let attack = config.attack;
	let decay = config.decay;
	let bpm = config.bpm;
	overtones = config.overtones

	for(let i=0; i<song.length; i++)
	{
		let a = song[i];
		let note = a[0];
		let length = a[1]/4 * 1/(bpm/60); // length stored as 1/4
		let octave = a[2];
		let f = get_note_frequency(note, octave);
		if( note != "r" ) // r == rest
		{
			for(let i =0; i<overtones.length; i++)
			{
				create_src(audioContext, volume * overtones[i], attack, decay, f * (i+1), t, length*0.95)
			}
		}
		t = t + length;
	}
	return t;
}

// https://en.wikipedia.org/wiki/Korobeiniki
song_korobeiniki = [
	["e", 2, 3], ["h", 1], ["c"],
	["d", 2], ["c", 1], ["h"],
	["a", 2], ["a", 1], ["c"],
	["e", 2], ["d", 1], ["c"],
	["h", 3], ["c", 1],
	["d", 2], ["e"],
	["c"], ["a"],
	["a", 3], ["r", 1],
	["r", 1], ["d", 2, 3], ["f", 1],
	["a", 2], ["g", 1], ["f", 1],
	["e", 3], ["c", 1],
	["e", 2], ["d", 1], ["c", 1],
	["h", 2], ["h", 1], ["c", 1],
	["d", 2], ["e"],
	["c"], ["a"],
	["a", 3], ["r", 1]
]

song_korobeiniki_bass = [
	["h", 4, 1], ["e", 4, 1],
	["a", 4, 1], ["e", 4, 1],
	["h", 4, 1], ["e", 4, 1],
	["a", 4, 1], ["a", 1, 1], ["a", 1, 1], ["h", 1, 1], ["c", 1, 2],
	["d", 4, 2], ["a"],
	["a"], ["e"],
	["h"], ["e"],
	["a"], ["a"]
]

var audioContext = new AudioContext();
var BPM = 85;

var playtime = 0;
var length = 0;
function play_song2(time)
{
	time = time / 1000;
	if( time-playtime > length)
	{
		console.log("play Korobeiniki!")
		let time2 = play_song( time, audioContext, song_korobeiniki, {volume: 0.02, attack: 0.002, decay: 0.03, bpm: BPM, overtones: [ 0.5, 0.2, 0.2, 0.1, 0.1 ] } )
		length = time2-time;
		play_song( time, audioContext, song_korobeiniki_bass, {volume: 0.1, attack: 0.005, decay: 0.03, bpm: BPM, overtones: [ 0.3, 0.1, 0, 0.1 ] } )
		playtime = time;
	}
}
