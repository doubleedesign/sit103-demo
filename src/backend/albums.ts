import Router from 'express-promise-router';
import { database } from './database';
const router = Router();

router.get('/', (req, res) => {
	res.status(404).json({ message: 'No data at this endpoint' });
});


export default router;
