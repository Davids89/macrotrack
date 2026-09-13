<script lang="ts">
	import { onMount } from 'svelte';
	import { db, MEAL_TYPES, suggestMealType, type MealType, type Recipe, type RecipeItem } from '$lib/db';
	import { fmt, toNumber } from '$lib/format';
	import { recipeGrams, recipeTotals } from '$lib/recipes';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import RecipeForm from './RecipeForm.svelte';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import { Select as SelectPrimitive } from 'bits-ui';

	let {
		onAdd,
		initialMealType
	}: {
		onAdd: (recipe: Recipe, mealType: MealType, grams: number) => void;
		initialMealType?: MealType;
	} = $props();

	const defaultMealType = () => initialMealType ?? suggestMealType();

	let recipes = $state<Recipe[]>([]);
	let mealType = $state<MealType>(defaultMealType());
	let selected = $state<Recipe | null>(null);
	let grams = $state('');
	let creating = $state(false);

	/** La receta nueva se guarda en la base de datos para reutilizarla, y queda elegida
	 *  para ajustar los gramos antes de añadirla al diario. */
	async function saveNew(data: { name: string; items: RecipeItem[] }) {
		const id = await db.recipes.add({ ...data, createdAt: Date.now() });
		recipes = await db.recipes.orderBy('name').toArray();
		creating = false;
		pick({ ...data, id, createdAt: Date.now() });
	}

	function pick(recipe: Recipe) {
		selected = recipe;
		grams = String(Math.round(recipeGrams(recipe.items)));
	}

	function add() {
		if (!selected || !(toNumber(grams) > 0)) return;
		onAdd(selected, mealType, toNumber(grams));
	}

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
	<Button variant="outline" size="sm" onclick={() => (creating = !creating)}>
		{creating ? 'Cancelar' : 'Nueva receta'}
	</Button>
	{#if creating}
		<div class="rounded-lg border border-border bg-card p-3">
			<RecipeForm submitLabel="Guardar y elegir" onSave={saveNew} />
		</div>
	{:else if recipes.length === 0}
		<p class="text-sm text-muted-foreground">
			Aún no tienes recetas. Crea una aquí o en <a class="underline" href="/foods">Alimentos › Recetas</a>.
		</p>
	{:else}
		<p class="text-xs text-muted-foreground">
			Cada receta entra como una sola comida; ajusta los gramos si comiste más o menos.
		</p>
		<ul class="flex max-h-64 flex-col gap-1 overflow-auto">
			{#each recipes as recipe (recipe.id)}
				<li>
					<Button
						variant="ghost"
						class="h-auto min-h-8 w-full items-start justify-between gap-2 py-2 font-normal"
						onclick={() => pick(recipe)}
					>
						<span class="min-w-0 flex-1 whitespace-normal break-words text-left">{recipe.name}</span>
						<span class="shrink-0 text-xs text-muted-foreground">{summary(recipe)}</span>
					</Button>
				</li>
			{/each}
		</ul>
		{#if selected}
			<div class="flex flex-col gap-2.5 rounded-lg border border-border bg-card p-3">
				<div class="flex items-center justify-between gap-2">
					<strong class="min-w-0 flex-1 truncate text-sm">{selected.name}</strong>
					<small class="shrink-0 text-muted-foreground">
						receta entera: {fmt(recipeGrams(selected.items))} g
					</small>
				</div>
				<div class="flex items-end gap-2">
					<div class="min-w-0 flex-1">
						<Label class="mb-1 block">Gramos</Label>
						<Input type="text" min="1" bind:value={grams} inputmode="decimal" />
					</div>
					<Button onclick={add} disabled={!(toNumber(grams) > 0)}>Añadir</Button>
				</div>
			</div>
		{/if}
	{/if}
</div>
