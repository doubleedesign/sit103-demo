<script lang="ts">
export default {
	name: 'LoadingState',
};
</script>;

<template>
	<div class="loading-state">
        <i class="fa-solid fa-spinner-third"></i>
        <p>Thinking about it &hellip;</p>
	</div>
</template>;

<style scoped lang="scss">
    @keyframes spin {
        from {
            transform: rotate(0deg);
        }
        to {
            transform: rotate(360deg);
        }
    }

	.loading-state {
        padding: 3rem;

        svg {
            width: 3rem;
            height: 3rem;
            animation: spin 2s linear infinite;
        }

        p {
            margin-top: 1rem;
            text-align: center;
        }
	}
</style>;
