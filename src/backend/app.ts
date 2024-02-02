import express from 'express';
import cors from 'cors';
import artists from './artists';
import tracks from './tracks';
import albums from './albums';

// Set up server
const app = express();
// app.use(cors({
// 	origin: 'http://localhost:5173'
// }));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.options('*', cors());

// API routes
app.use('/artists', artists);
app.use('/tracks', tracks);
app.use('/albums', albums);

app.get('/', (req, res) => {
	res.status(200).json({ message: 'This is not the endpoint you are looking for' });
});

// Start server
app.listen(4000, () => {
	console.log('Server is running on port 4000');
});
