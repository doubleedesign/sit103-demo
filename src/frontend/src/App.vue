<script lang="ts">
import { defineComponent } from 'vue';
import LoadingState from './components/LoadingState.vue';
import ArtistsTable from './components/ArtistsTable.vue';
import { getData } from './utils.ts';
import { Album, Artist, Genre, Track } from '../../../types';
import TracksTable from './components/TracksTable.vue';

const emptyFilters = {
	country: '',
	genre: null,
	decade: null,
	resultCount: 0
};

export default defineComponent({
	components: { ArtistsTable, TracksTable, LoadingState },
	data() {
		return {
			selected: '',
			filters: emptyFilters,
			artists: [] as Array<Artist>,
			tracks: [] as Array<Track>,
			albums: [] as Array<Album>,
			countries: [],
			genres: [] as Array<Genre>,
			decade: null,
			searchTerm: '',
			loading: false,
			resultCount: 0
		};
	},
	async mounted() {
		// We only need to get some small datasets like countries and genres once, so do it when the app is mounted
		this.countries = await getData('/artists/countries') ?? [];
		this.genres = await getData('/tracks/genres') ?? [];
	},
	methods: {
		setSelection: function (event: Event) {
			// Clear all current data
			this.clearValues();

			// Get the selected option of the select element that triggered this method
			const target = event.target as HTMLSelectElement;
			this.selected = target.value;
			this.loading = false;
		},
		updateFilter: function (event: Event) {
			// Get the ID and selected option of the select element that triggered this method
			const target = event.target as HTMLSelectElement;
			const filter: string = target.getAttribute('id') as string;
			// Add the filter using the ID as the key and the selected option as the value
			this.filters = {
				...this.filters,
				[filter]: target.value
			};
			// Ensure the search is cleared as the combination of search + filters has not been accounted for yet
			this.searchTerm = '';
		},
		setSearchValue: function (event: Event) {
			const target = event.target as HTMLInputElement;
			// If the field has been cleared, empty the dataset
			if (target.value.length === 0) {
				this.loading = false;
				this.artists = [];
				this.albums = [];
				this.tracks = [];
			}
			// If it has a value, set loading state and search term
			else {
				this.loading = true;
				this.searchTerm = target.value;
			}
		},
		clearValues: function () {
			this.artists = [];
			this.albums = [];
			this.tracks = [];
			this.searchTerm = '';
			this.filters = emptyFilters;
			this.loading = false;
			this.resultCount = 0;
		}
	},
	watch: {
		// When the value of "filters" changes, update the data by querying the API using the filters as parameters
		// We need to re-query the database rather than filter the existing data because the current results, i.e., value of this.data, may not contain all the data we need anymore
		// And keeping a separate array of the full dataset seems inefficient once it gets really big - we should query for smaller datasets as needed
		async filters(newFilters) {
			this.loading = true;
			if (newFilters.country) {
				this.clearValues();
				if(this.selected === 'individual_artists') {
					this.artists = await getData(`/artists/people?country=${newFilters.country}`);
					this.loading = false;
					this.resultCount = this.artists.length ?? 0;
				}
				else if(this.selected === 'group_artists') {
					this.artists = await getData(`/artists/groups?country=${newFilters.country}`);
					this.loading = false;
					this.resultCount = this.artists.length ?? 0;
				}
			}

			if(newFilters.genre || newFilters.decade) {
				this.clearValues();
				if(this.selected === 'albums') {
					const albums = await getData(`/albums?genre=${newFilters.genre}&decade=${newFilters.decade}`);
					this.albums = albums;
					this.loading = false;
					this.resultCount = albums.length ?? 0;
				}
				else if(this.selected === 'tracks') {
					const tracks = await getData(`/tracks?genre=${newFilters.genre}&decade=${newFilters.decade}`);
					this.tracks = tracks;
					this.loading = false;
					this.resultCount = tracks.length ?? 0;
				}
			}
		},
		// When the search term changes, update the data by querying the API using the search term as a parameter
		async searchTerm(newSearchTerm) {
			if (newSearchTerm) {
				this.clearValues();
				if(this.selected === 'group_artists') {
					this.loading = true;
					// Don't respond too quickly because we'll hit the database more than necessary
					setTimeout(async () => {
						// Grab both the group record and the individual members
						const group = await getData(`/artists/groups?search=${newSearchTerm}`);
						const members = await getData(`/artists/groups/members?search=${newSearchTerm}`);
						// Merge into one, with the group listed first
						const merged = group.concat(members);
						this.artists = merged;
						this.resultCount = merged.length;
						this.loading = false;
					}, 500);
				}
			}
		}
	},
});
</script>

<template>

    <div class="pseudo-form row">
        <div class="form-field-wrapper col-12 col-lg-3">
            <label for="data-type" class="form-label">Data type</label>
            <select id="data-type" @change="setSelection" class="form-select" aria-label="Select the type of data to view">
                <option selected value="">Please select</option>
                <option value="individual_artists">Individual artists</option>
                <option value="group_artists">Bands/groups</option>
                <option value="albums">Albums</option>
                <option value="tracks">Tracks</option>
            </select>
        </div>

        <div id="artist-fields"  v-if="selected === 'individual_artists' || selected === 'group_artists'" class="col-12 col-lg-9">
            <div class="row">
                <div v-if="selected === 'individual_artists'" class="form-field-wrapper col-12 col-lg-4">
                    <label for="country" class="form-label">Country</label>
                    <select id="country" @change="updateFilter" class="form-select" aria-label="Select the country to filter by">
                        <option value="">All countries</option>
                        <option v-for="country in countries" :key="country" :value="country" :selected="filters.country === country">
                            {{ country }}
                        </option>
                    </select>
                </div>
                <div v-if="selected === 'group_artists'" class="form-field-wrapper col-12 col-lg-4">
                    <label for="group-members" class="form-label">Group name</label>
                    <input id="group-members" @input="setSearchValue" class="form-control" type="text" placeholder="Enter search term" aria-label="Search for group members">
                </div>
            </div>
        </div>

        <div id="track-and-album-fields" v-if="selected === 'tracks' || selected === 'albums'" class="col-12 col-lg-9">
            <div class="row">
                <div class="form-field-wrapper col-12 col-lg-4">
                    <label for="genre" class="form-label">Genre</label>
                    <select id="genre" @change="updateFilter" class="form-select" aria-label="Select the genre to filter by">
                        <option value="">All genres</option>
                        <option v-for="genre in genres" :key="genre.id" :value="genre.id">
                            {{ genre.name }}
                        </option>
                    </select>
                </div>
                <div class="form-field-wrapper col-12 col-lg-4">
                    <label for="decade" class="form-label">Decade</label>
                    <select id="decade" @change="updateFilter" class="form-select" aria-label="Select the decade to filter by">
                        <option value="">All decades</option>
                        <option v-for="decade in [1960, 1970, 1980, 1990, 2000, 2010, 2020]" :key="decade" :value="decade">
                            {{ decade }}s
                        </option>
                    </select>
                </div>
            </div>
        </div>
    </div>

    <div v-if="resultCount < 101" class="result-count">
        <p>Showing {{resultCount}} results</p>
    </div>
    <div v-else class="result-count">
        <p>Showing first 100 results</p>
    </div>


    <Transition v-if="!loading && resultCount === 0">
        <div class="alert alert-info">Please enter some selections to begin.</div>
    </Transition>
    <Transition v-if="loading">
        <LoadingState />
    </Transition>
    <Transition v-if="resultCount > 0 && (selected === 'individual_artists' || selected === 'group_artists')">
        <ArtistsTable :data="artists"/>
    </Transition>
    <Transition v-if="resultCount > 0 && selected === 'tracks'">
        <TracksTable :data="tracks"/>
    </Transition>

</template>

<style lang="scss">
@use "sass:color";
@use "sass:map";

$theme-colors: (
    "primary": #4c3499,
    "secondary": #9e67ba,
    "info": #fbb039,
    "success": #19ad69,
    "warning": #e3ce17,
    "danger": #dc412b,
    "light": #e0dce1,
    "dark": #2d2d2d
);

:root {
    @each $color, $value in $theme-colors {
        --bs-#{$color}: #{$value};

        .btn-#{$color} {
            --bs-btn-bg: #{$value};
            --bs-btn-border-color: #{$value};
            --bs-btn-hover-bg: #{color.scale($value, $lightness: -20%)};
            --bs-btn-active-bg: #{color.scale($value, $lightness: -20%)};
            --bs-btn-hover-border-color: #{color.scale($value, $lightness: -20%)};
        }
    }

    .btn {
        text-decoration: underline;
        text-decoration-color: transparent;
        transition: all 0.2s ease;

        &:hover, &:focus, &:active {
            text-decoration-color: currentColor;
        }

        &-link {
            color: map.get($theme-colors, 'secondary');

            &:hover, &:focus, &:active {
                color: map.get($theme-colors, 'primary');
            }
        }
    }
}

.pseudo-form {
    margin-bottom: 1rem;
}

.result-count {
    text-align: right;
}

.form-field-wrapper {
    display: flex;
    flex-direction: column;
    justify-content: flex-end;

    label {
        display: block;
        text-align: left;
    }
}

</style>
