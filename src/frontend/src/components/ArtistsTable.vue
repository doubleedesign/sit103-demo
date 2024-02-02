<script lang="ts">

import { Artist } from '../../../../types.ts';

export default {
	name: 'ArtistsTable',
	props: {
		data: {
			type: Array<Artist>
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
                    <th class="name">Name</th>
                    <th class="actions" colspan="2">Actions</th>
                    <th class="icon"><i class="fa-regular fa-link"></i>Discogs</th>
                </tr>
                </thead>
                <tbody>
                <tr v-for="artist in data" :key="artist.id">
                    <td class="name">{{ artist.name }}</td>
                    <td class="action"><a class="btn btn-primary btn-sm" href="#">View</a></td>
                    <td class="action"><a class="btn btn-secondary btn-sm" href="#">Edit</a></td>
                    <td class="icon">
                        <a class="btn btn-link" :href="`https://www.discogs.com/artist/${artist.did}`" target="_blank">
                            <i class="fa-solid fa-compact-disc"></i>
                        </a>
                    </td>
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

    .name {
        text-align: left;
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
