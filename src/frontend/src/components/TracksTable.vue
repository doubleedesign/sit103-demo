<script lang="ts">

import { Track } from '../../../../types.ts';

export default {
	name: 'TracksTable',
	props: {
		data: {
			type: Array<Track>
		}
	},
};
</script>;

<template>
    <div class="row">
        <div class="col-12">
            <table class="table table-striped">
                <thead>
                    <tr>
                        <th class="title">Title</th>
                        <th class="year">Year</th>
                        <th class="artist">Artist</th>
                        <th class="genre">Genre</th>
                        <th class="actions" colspan="2">Actions</th>
                        <th class="playcount">Play count</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="track in data" :key="track.id">
                        <td class="title">{{ track.title }}</td>
                        <td class="year">{{ track.year }}</td>
                        <td class="artist">{{track.artist_name}}</td>
                        <td class="genre">{{track.genre}}</td>
                        <td class="action"><a class="btn btn-primary btn-sm" href="#">View</a></td>
                        <td class="action"><a class="btn btn-secondary btn-sm" href="#">Edit</a></td>
                        <td class="playcount">{{ track.playcount }}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>;

<style scoped lang="scss">
.table {
    margin: 0 auto;

    th {
        vertical-align: bottom;
    }

    td {
        vertical-align: middle;
    }

    .title, .year, .genre, .artist {
        text-align: left;
    }

    .playcount {
        text-align: right;
    }

    .actions {
        width: 6rem;
    }

    .action {
        width: 3rem;
        box-sizing: content-box;

        .btn {
            width: 100%;
        }

        + .action {
            padding-left: 0;
        }
    }

    .icon {
        width: 3rem;

        svg {
            width: 1.2rem;
            height: 1.2rem;
        }
    }
}
</style>
