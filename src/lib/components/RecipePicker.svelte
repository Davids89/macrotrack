<script lang="ts">
	import { onMount } from 'svelte';
	import { db, MEAL_TYPES, suggestMealType, type MealType, type Recipe } from '$lib/db';
	import { fmt } from '$lib/format';
	import { recipeGrams, recipeTotals } from '$lib/recipes';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import { Select as SelectPrimitive } from 'bits-ui';

	let {
		onAdd,
		initialMealType
	}: {
		onAdd: (recipe: Recipe, mealType: MealType) => void;
		initialMealType?: MealType;
	} = $props();

	const defaultMealType = () => initialMealType ?? suggestMealType();

	let recipes = $state<Recipe[]>([]);
	let mealType = $state<MealType>(defaultMealType());

	onMount(async () => {
		recipes = await db.recipes.orderBy('name').toArray();
	});

	function summary(recipe: Recipe): string {
		const t = recipeTotals(recipe.items);
		return `${fmt(t.kcal, 0)} kcal · ${fmt(recipeGrams(recipe.items))} g · ${recipe.items.length} ${recipe.items.length === 1 ? 'alimento' : 'alimentos'}`;
	}
</script>

<div class="flex flex-col gap-2">
	<div>
		<Label class="mb-1 block">Tipo</Label>
		<Select.Root bind:value={mealType}>
			<Select.Trigger class="w-full">
				<SelectPrimitive.Value placeholder="Tipo" />
			</Select.Trigger>
			<Select.Content>
				{#each MEAL_TYPES as type}
					<Select.Item value={type.key}>{type.label}</Select.Item>
				{/each}
			</Select.Content>
		</Select.Root>
	</div>
	{#if recipes.length === 0}
		<p class="text-sm text-muted-foreground">
			Aún no tienes recetas. Créalas en <a class="underline" href="/foods">Alimentos › Recetas</a>.
		</p>
	{:else}
		<p class="text-xs text-muted-foreground">Cada receta entra como una ración y una sola comida.</p>
		<ul class="flex max-h-64 flex-col gap-1 overflow-auto">
			{#each recipes as recipe (recipe.id)}
				<li>
					<Button
						variant="ghost"
						class="h-auto min-h-8 w-full items-start justify-between gap-2 py-2 font-normal"
						onclick={() => onAdd(recipe, mealType)}
					>
						<span class="min-w-0 flex-1 whitespace-normal break-words text-left">{recipe.name}</span>
						<span class="shrink-0 text-xs text-muted-foreground">{summary(recipe)}</span>
					</Button>
				</li>
			{/each}
		</ul>
	{/if}
</div>
