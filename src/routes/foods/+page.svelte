<script lang="ts">
	import FoodList from '$lib/components/FoodList.svelte';
	import RecipeList from '$lib/components/RecipeList.svelte';
	import { Button } from '$lib/components/ui/button';

	let tab = $state<'alimentos' | 'recetas'>('alimentos');
</script>

<div class="flex gap-0.5 rounded-lg border border-border bg-card p-0.5">
	<Button
		variant="ghost"
		size="sm"
		class="flex-1 {tab === 'alimentos' ? 'bg-secondary text-foreground' : ''}"
		aria-pressed={tab === 'alimentos'}
		onclick={() => (tab = 'alimentos')}
	>Alimentos</Button>
	<Button
		variant="ghost"
		size="sm"
		class="flex-1 {tab === 'recetas' ? 'bg-secondary text-foreground' : ''}"
		aria-pressed={tab === 'recetas'}
		onclick={() => (tab = 'recetas')}
	>Recetas</Button>
</div>

{#if tab === 'alimentos'}
	<FoodList />
{:else}
	<RecipeList />
{/if}
