<script lang="ts">
	import { onMount } from 'svelte';
	import { db, MEAL_TYPES, suggestMealType, type MealType, type Recipe, type RecipeItem } from '$lib/db';
	import { fmt, fold, toNumber } from '$lib/format';
	import { matchesMeal, mostUsed, portionGrams, recipeGrams, recipeTotals } from '$lib/recipes';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import RecipeForm from './RecipeForm.svelte';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import { Select as SelectPrimitive } from 'bits-ui';
	import HistoryIcon from '@lucide/svelte/icons/history';

	let {
		onAdd,
		initialMealType
	}: {
		onAdd: (recipe: Recipe, mealType: MealType, grams: number) => void;
		/** El «+» de una comida lo trae puesto; el «+» verde lo deja en blanco y no filtra. */
		initialMealType?: MealType;
	} = $props();

	let recipes = $state<Recipe[]>([]);
	// svelte-ignore state_referenced_locally
	let mealType = $state<MealType | ''>(initialMealType ?? '');
	let selected = $state<Recipe | null>(null);
	let grams = $state('');
	let part = $state('1');
	let parts = $state('1');
	let creating = $state(false);
	let query = $state('');

	const visible = $derived(recipes.filter((recipe) => matchesMeal(recipe, mealType || undefined)));
	const top = $derived(mostUsed(visible));

	// Con una receta elegida el buscador muestra su nombre; solo vuelve a listar al escribir.
	const results = $derived.by(() => {
		if (selected && query === selected.name) return [];
		const q = fold(query);
		return (q ? visible.filter((recipe) => fold(recipe.name).includes(q)) : visible).slice(0, 8);
	});

	// Si cambias el tipo de comida, la receta elegida que ya no encaja se suelta.
	$effect(() => {
		if (selected && !visible.some((recipe) => recipe.id === selected!.id)) clear();
	});

	function clear() {
		selected = null;
		query = '';
	}

	/** Porciones habituales de una receta que se come en varios días. */
	const PRESETS = [
		{ label: 'entera', part: 1, parts: 1 },
		{ label: '½', part: 1, parts: 2 },
		{ label: '⅓', part: 1, parts: 3 },
		{ label: '¼', part: 1, parts: 4 },
		{ label: '⅔', part: 2, parts: 3 }
	];

	function applyPortion(n = toNumber(part), d = toNumber(parts)) {
		if (!selected) return;
		const g = portionGrams(selected.items, n, d);
		if (g > 0) grams = String(g);
	}

	function preset(p: { part: number; parts: number }) {
		part = String(p.part);
		parts = String(p.parts);
		applyPortion(p.part, p.parts);
	}

	/** La receta nueva se guarda en la base de datos para reutilizarla, y queda elegida
	 *  para ajustar los gramos antes de añadirla al diario. */
	async function saveNew(data: { name: string; mealTypes: MealType[]; items: RecipeItem[] }) {
		const id = await db.recipes.add({ ...data, createdAt: Date.now() });
		recipes = await db.recipes.orderBy('name').toArray();
		creating = false;
		// Si la receta nueva no encaja con el filtro actual, el filtro estorba: fuera.
		if (!matchesMeal(data, mealType || undefined)) mealType = '';
		pick({ ...data, id, createdAt: Date.now() });
	}

	function pick(recipe: Recipe) {
		selected = recipe;
		query = recipe.name;
		part = '1';
		parts = '1';
		grams = String(Math.round(recipeGrams(recipe.items)));
	}

	function add() {
		if (!selected || !(toNumber(grams) > 0)) return;
		// Sin tipo elegido (el «+» verde) la comida va al momento que toque por la hora.
		onAdd(selected, mealType || suggestMealType(), toNumber(grams));
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
				<SelectPrimitive.Value placeholder="Todas las comidas" />
			</Select.Trigger>
			<Select.Content>
				<Select.Item value="">Todas las comidas</Select.Item>
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
	{:else if visible.length === 0}
		<p class="text-sm text-muted-foreground">
			{recipes.length === 0
				? 'Aún no tienes recetas.'
				: 'Ninguna receta para esta comida; pon el tipo en «Todas las comidas» para verlas.'}
			Crea una aquí o en <a class="underline" href="/foods">Alimentos › Recetas</a>.
		</p>
	{:else}
		<p class="text-xs text-muted-foreground">
			Cada receta entra como una sola comida; elige qué parte tomaste (p. ej. ⅓ del gazpacho).
		</p>
		<div>
			<Label class="mb-1 block" for="recipe-search">Receta</Label>
			<Input
				id="recipe-search"
				type="search"
				placeholder="Elige o busca una receta…"
				bind:value={query}
				oninput={() => {
					if (selected && query !== selected.name) selected = null;
				}}
			/>
			{#if results.length > 0}
				<ul class="mt-1 flex max-h-64 flex-col gap-1 overflow-auto">
					{#each results as recipe (recipe.id)}
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
			{/if}
		</div>
		{#if top.length > 0}
			<div class="flex flex-wrap gap-1.5">
				{#each top as recipe (recipe.id)}
					<Button variant="outline" size="xs" class="max-w-full" onclick={() => pick(recipe)}>
						<HistoryIcon class="text-muted-foreground" />
						<span class="truncate">{recipe.name}</span>
					</Button>
				{/each}
			</div>
		{/if}
		{#if selected}
			<div class="flex flex-col gap-2.5 rounded-lg border border-border bg-card p-3">
				<div class="flex items-center justify-between gap-2">
					<strong class="min-w-0 flex-1 truncate text-sm">{selected.name}</strong>
					<small class="shrink-0 text-muted-foreground">
						receta entera: {fmt(recipeGrams(selected.items))} g
					</small>
				</div>
				<div>
					<Label class="mb-1 block">Porción</Label>
					<div class="flex items-center gap-2">
						<Input
							class="w-16"
							type="text"
							inputmode="decimal"
							aria-label="Partes tomadas"
							bind:value={part}
							oninput={() => applyPortion()}
						/>
						<span class="text-sm text-muted-foreground">de</span>
						<Input
							class="w-16"
							type="text"
							inputmode="decimal"
							aria-label="Partes totales de la receta"
							bind:value={parts}
							oninput={() => applyPortion()}
						/>
						<span class="text-sm text-muted-foreground">partes</span>
					</div>
					<div class="mt-1.5 flex flex-wrap gap-1">
						{#each PRESETS as p}
							<Button variant="outline" size="sm" onclick={() => preset(p)}>{p.label}</Button>
						{/each}
					</div>
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
