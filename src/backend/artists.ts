import Router from 'express-promise-router';
import { database } from './database';
const router = Router();

router.get('/', (req, res) => {
	res.status(404).json({ message: 'No data at this endpoint' });
});


/**
 * GET endpoint that queries the database for all countries artists in the database are from
 */
router.get('/countries', async function(req, res) {
	const result = await database.getCountries();
	res.status(200).json(result);
});


/**
 * GET endpoint that queries the database for individual artists
 */
router.get('/people', async function(req, res) {
	const result = await database.getIndividualArtists(req.query as unknown as { [key: string]: string }[]);

	res.status(200).json(result);
});


/**
 * GET endpoint that queries the database for groups
 */
router.get('/groups', async function(req, res) {
	const result = await database.getGroups(req.query as unknown as { [key: string]: string }[]);
	res.status(200).json(result);
});


/**
 * GET endpoint that queries the database for members of a searched-for group
 */
router.get('/groups/members', async function(req, res) {
	const result = await database.getGroupMembers(req.query.search as string);
	res.status(200).json(result);
});


export default router;
