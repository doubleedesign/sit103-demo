import mysql, { type Pool } from 'mysql2';
import omit from 'lodash/omit';

const connection: Pool = mysql.createPool({
	host: 'localhost',
	user: 'root',
	password: 'root',
	database: 'project'
});

export const database = {
	/**
	 * Get individual artists including query parameters passed to a MySQL WHERE clause
	 * Or if there are no parameters, return all individual artists
	 * @param params - query parameters
	 */
	getIndividualArtists: async function(params = []) {
		if(Object.keys(params).length > 0) {
			const where = `${Object.entries(params).map(([key, value]) => {
				return `${key} = '${value}'`;
			}).join(' AND ')}`;

			const [rows] = await connection.promise().query(` 
			    SELECT artists.id, name, did, country FROM artists
			    INNER JOIN artists_individuals ON artists.id = artists_individuals.id
			    WHERE ${where}`);

			return rows;
		}
		else {

			const [rows] = await connection.promise().query(`
                SELECT artists.id, name, did, country
                FROM artists
                         INNER JOIN artists_individuals ON artists.id = artists_individuals.id`);

			return rows;
		}
	},


	/**
	 * Get groups including query parameters passed to a MySQL WHERE clause
	 * Or if there are no parameters, return all groups
	 * @param params
	 */
	getGroups: async function(params = []) {
		// TODO: Handle other params being passed with search
		// Currently other params will be ignored if search is present
		if(Object.keys(params).length > 0 && Object.keys(params).includes('search')) {
			const searchTerm = params['search'];

			const [rows] = await connection.promise().query(`
				SELECT artists.id, name, did, country from artists
				INNER JOIN artists_groups on artists_groups.id = artists.id
				WHERE artists_groups.id IN (SELECT id from artists WHERE name LIKE '%${searchTerm}%')`);

			return rows;
		}

		// TODO: Should be able to remove this one once other params are handled with search
		else if(Object.keys(params).length > 0 && omit(params, 'search').length > 0) {
			const where = `${Object.entries(params).map(([key, value]) => `${key} = '${value}'`).join(' AND ')}`;

			const [rows] = await connection.promise().query(`
                SELECT artists.id, name, did, country from artists
                INNER JOIN artists_groups ON artists_groups.id = artists.id
			    WHERE ${where}`);

			return rows;
		}

		const [rows] = await connection.promise().query(`
            SELECT artists.id, name, did, country from artists
            INNER JOIN artists_groups ON artists_groups.id = artists.id`);

		return rows;
	},


	/**
	 * Get group members of a group based on a search term
	 * @param searchTerm
	 */
	getGroupMembers: async function(searchTerm: string) {
		const [rows] = await connection.promise().query(`
            SELECT artists.id, name, did, country from artists
			INNER JOIN artists_groups_members ON artists.id = artists_groups_members.artist_id
			INNER JOIN artists_groups ON artists_groups_members.group_id = artists_groups.id
            WHERE artists_groups.id IN (SELECT id from artists WHERE name LIKE '${searchTerm}%');`);

		return rows;
	},


	/**
	 * Get all countries artists in the database are from
	 */
	getCountries: async function() {
		const [rows] = await connection.promise().query(`
			SELECT DISTINCT country from artists`);

		return (rows as unknown[]).map((row: {country: string | null}) => row.country).filter((country: string | null) => country !== null);
	},


	/**
	 * Get all genres available in the database
	 */
	getGenres: async function() {
		const [rows] = await connection.promise().query(`
			SELECT * from genre`);

		return rows;
	},


	/**
	 * Get 100 tracks including query parameters passed to a MySQL WHERE clause
	 * @param params
	 */
	getTracks: async function(params = []) {
		const where = [];

		if (params['genre'] && !isNaN(parseInt(params['genre']))) {
			where.push(`genre.id = ${params['genre']}`);
		}

		if (params['decade'] && !isNaN(parseInt(params['decade']))) {
			where.push(`year BETWEEN ${params['decade']} AND ${parseInt(params['decade']) + 9}`);
		}

		const [rows] = await connection.promise().query(`
			SELECT tracks.id, title, artists.name as artist_name, year, playcount, genre.name as genre from tracks
         	INNER JOIN genre ON tracks.genre_id = genre.id
			INNER JOIN tracks_artists ON tracks.id = tracks_artists.track_id
         	INNER JOIN artists on tracks_artists.artist_id = artists.id
                ${where.length > 0 ? `WHERE ${where.join(' AND ')}` : ''}
         	ORDER BY playcount desc LIMIT 100`
		);

		return rows;
	}
};

