import { XMLParser } from 'fast-xml-parser';
import { readFileSync } from 'node:fs';
import mysql, { Pool } from 'mysql2';

const connection: Pool = mysql.createPool({
	host: 'localhost',
	user: 'root',
	password: 'root',
	database: 'project'
});


// Expecting iTunes library XML export for the file. Notes:
// Remove playlists, so it's just the track data
// This expects structure of <plist><dict containing a bunch of keys we don't need><dict of the actual tracks>
const parseXML = async () => {
	const file = readFileSync('./xml/Library-2023.xml', 'utf8');

	// Parse XML to JSON using fast-xml-parser library
	// NOTE: preserveOrder is important! Without it, we get a tricky and unreliable structure of
	// {key: all the keys, string: all the values that are strings, ...etc for all the data types present}
	// with it, they stay in order e.g. key: {data about the key}, string:{the value and data about it}
	const parser = new XMLParser({
		ignoreDeclaration: true, // ignore <?xml> declaration tag
		preserveOrder: true,
		textNodeName: 'value'
	});
	const json = parser.parse(file);

	// Get track data
	const data = json[0].plist[0].dict;
	const raw = data[data.length - 1].dict; // assuming the <dict> containing the tracks is the last element

	// Using preserveOrder: true, we get key objects followed by the corresponding value <dict> objects
	// We don't actually need the <key>s, so we can filter to get just the <dict>s first
	// @ts-ignore
	const filtered = Object.values(raw).filter(({ dict }: unknown) => dict);

	// Then, reduce that down so we don't have the "dict" property key anymore - just the data objects
	// @ts-ignore
	const rawTracks = filtered.map(item => item.dict);

	// Then, each raw track object is a series of keys and values in objects
	// So we have to loop through them all to transform them (adding the transformed values to a new array)
	const tracks = [];
	// eslint-disable-next-line no-unused-vars,@typescript-eslint/no-unused-vars
	for (const [k, data1] of Object.entries(rawTracks)) {
		// Initialise object that will store the data for this individual track
		const formatted = {
			track_id: 0,
			persistent_id: '',
			name: '',
			play_count: 0,
			total_time: '',
			artist: '',
			album_artist: '',
			sort_artist: '',
			composer: '',
			album: '',
			sort_album: '',
			track_number: 0,
			year: '',
			genre: ''
		};

		// Each value is also an array of key objects followed by value objects labelled by data type
		// This time, we do want the keys
		// This implementation assumes a consistent key, value, key, value pattern with expected structures in the data
		for (let i = 0; i < data1.length; i += 2) {

			// data[i] is the key, in a format like { key: [ { value: 'Artist' } ] } (where "Artist" is the bit we want)
			// Object.entries converts that to an array, but it's nested, so .flat() simplifies it to something like
			// [ 'key', [ { value: 'Artist' } ] ]
			const thisKeyData = Object.entries(data1[i]).flat();

			// data[i + 1] is expected to be the track data that matches this key
			// Using Object.values() here because we don't need the key (it's the data type of the value)
			// This also results in a weirdly nested array that needs to be flattened to get to the data more easily
			// Final result is an array with one value, which is an object: [ { value: 'The Corrs' } ]
			const thisValueData = Object.values(data1[i + 1]).flat();

			// Check that we are definitely looking at a key, and that the value exists
			if (thisKeyData[0] === 'key' && thisValueData[0]) {
				// Dig into the key and value objects to get what we want
				// @ts-ignore
				let key: string = thisKeyData[1][0]['value'];
				// @ts-ignore
				const value: string = thisValueData[0]['value'];

				// There's some "tracks" I don't actually want - TV show episodes and sound clips
				// At the time of writing, all TV shows are from the iTunes store,
				// so "Kind": "Purchased MPEG-4 video file" is a reasonable way to find and exclude them
				if (key === 'Kind' && value === 'Purchased MPEG-4 video file') {
					continue;
				}
				if (key === 'Genre' && value === 'Sound Clip') {
					continue;
				}

				// There's also more data than I actually want, so let's only include what's specified in the Track type
				key = key.toLowerCase().replaceAll(' ', '_');
				if (Object.keys(formatted).includes(key)) {
					formatted[key] = value;
				}

				//
				/**
				 * "Album Artist" is used for grouping tracks into albums while
				 * retaining the ability to list extra artists in the Artist field
				 * e.g., "Shine", Artist "Lisa Marie Presley & P!nk",
				 *               Album Artist: "Lisa Marie Presley",
				 *               Album: "Now What"
				 *       ensures that the song appears under "Now What" by "Lisa Marie Presley" and
				 *       not a separate version of "Now What" by "Lisa Marie Presley & P!nk".
				 * 	However, not all tracks will have the Album Artist field populated,
				 * 	so this has it fall back to the value of the Artist field
				 */
				if (!formatted['album_artist']) {
					formatted['album_artist'] = formatted['artist'];
				}

				/**
				 * "Sort Artist" is used less frequently but still serves an important purpose, such as allowing me to:
				 * - call those 5 British legends "The Spice Girls" but correctly
				 * 	 query data sources that call them "Spice Girls"
				 * - group stuff by artist according to personal preferences
				 *   e.g., "Where No One Stands Alone" by
				 *          Artist "Elvis & Lisa Marie Presley",
				 *          Album Artist "Elvis Presley",
				 * 			Sort Artist "Lisa Marie Presley"
				 *      so the album is correctly identified as an Elvis album
				 * 		but the track appears in Lisa Marie's body of work and is counted in her play counts not Elvis's
				 * 	    (@see api/datasources/itunes if you need to check that's still true)
				 * If the "sort artist" field is not populated,
				 * then this makes it fall back to the value of the Artist field
				 */
				if (!formatted['sort_artist']) {
					formatted['sort_artist'] = formatted['artist'];
				}
			}
		}

		tracks.push(formatted);
	}


	// Loop through the tracks and insert them into the database
	// I could do this in the previous loop, but this made it easier to test small batches
	for (const track of tracks) {

		try {
			// Get the genre ID, and if it doesn't exist, add the genre to the database
			const [genre] = await connection.promise().query(`
				SELECT id FROM genre WHERE name = '${track.genre}'`);

			let genreId = null;
			// @ts-ignore
			if(genre.length === 1) {
				// @ts-ignore
				genreId = genre[0].id;
			}
			// @ts-ignore
			if(genre.length === 0) {
				const [genre] = await connection.promise().query(`
					INSERT INTO genre (name) VALUES ('${track.genre}')`);

				// @ts-ignore
				genreId = genre.insertId;
			}

			// Insert the core track data into the database
			const [insertedTrack] = await connection.promise().query(`
	                INSERT INTO tracks (title, year, playcount, genre_id)
	                VALUES ('${track.name}', '${track.year}', '${track.play_count}', '${genreId}')`);

			// Get the ID of the track that was just inserted
			// @ts-ignore
			const trackId = insertedTrack.insertId;

			// Find the main artist, and if they don't exist in the database, create them
			const [artist] = await connection.promise().query(`
			SELECT id FROM artists WHERE name = '${track.artist}'`);

			let artistId;
			// TODO: Handle edge case of multiple results
			// @ts-ignore
			if(artist.length === 1) {
			// @ts-ignore
				artistId = artist[0].id;
			}
			// @ts-ignore
			if(artist.length === 0) {
				const [artist] = await connection.promise().query(`
				INSERT INTO artists (name) VALUES ('${track.artist}')`);
				// @ts-ignore
				artistId = artist.insertId;
			}

			// Connect in the associative entity
			// Cheating a bit cos I already know the role IDs, but in a real-world scenario, I'd have to query for them
			if(artistId) {
				await connection.promise().query(`
	                INSERT INTO tracks_artists (track_id, artist_id, role_id)
	                VALUES ('${trackId}', '${artistId}', 1);
				`);

				// TODO: Handle composers
				// This is a single text field but contains lists separated by a variety of characters including commas, ampersands, slashes etc
			}


			// Do the same for the album
			let albumId;
			// @ts-ignore
			const [album] = await connection.promise().query(`
				SELECT id FROM albums WHERE title = '${track.album}'`);

			// @ts-ignore
			if(album.length === 1) {
				// @ts-ignore
				albumId = album[0].id;
			}
			// @ts-ignore
			if(album.length === 0) {
				const [album] = await connection.promise().query(`
					INSERT INTO albums (title, year, artist_id)
					VALUES ('${track.album}', '${track.year}', '${artistId}')`);

				// @ts-ignore
				albumId = album.insertId;
			}

			if(albumId) {
				await connection.promise().query(`
					INSERT INTO tracks_albums (track_id, album_id, track_no)
					VALUES ('${trackId}', '${albumId}', '${track.track_number}');
				`);
			}
		}
		catch (err) {
			console.log(err);
		}
	}
};

parseXML().then();
