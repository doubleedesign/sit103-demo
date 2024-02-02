import Router from 'express-promise-router';
import { database } from './database';
const router = Router();


/**
 * Get tracks from the database including parameters if included
 */
router.get('/', async (req, res) => {
	const result = await database.getTracks(req.query as unknown as { [key: string]: string }[]);
	res.status(200).json(result);
});


/**
 * Get all available genres
 */
router.get('/genres', async function(req, res) {
	const result = await database.getGenres();
	res.status(200).json(result);
});


export default router;
