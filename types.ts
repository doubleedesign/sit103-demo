export type Genre = {
	id: number;
	name: string;
};

export type Artist = {
	id: number;
	name: string;
	did?: string;
	country?: string;
	birthdate?: string;
	deathdate?: string;
};

export type Track = {
	id: number;
	title: string;
	year?: number;
	playcount?: number;
	iswc?: string;
	artist_name?: string;
	genre?: string;
};

export type Album = {
	id: number;
	title: string;
	year?: number;
	barcode?: string;
	mbid?: string;
	artist_name?: string;
	genre?: string;
};

