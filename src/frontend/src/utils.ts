export async function getData(endpoint: string) {
	try {
		return fetch(`http://localhost:4000${endpoint}`, { method: 'GET' })
			.then(response => {
				return response.json();
			})
			.then(result => {
				return result;
			})
			.catch(error => console.log('error', error));
	}
	catch(error) {
		console.error(error);
		return [];
	}
}
