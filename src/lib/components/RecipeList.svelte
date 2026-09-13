<script lang="ts">
	import { onMount } from 'svelte';
	import { db, type Food, type Recipe, type RecipeItem } from '$lib/db';
	import { fmt } from '$lib/format';
	import { recipeGrams, recipeItem, recipeTotals } from '$lib/recipes';
	import FoodPicker from './FoodPicker.svelte';
	import ConfirmDialog from './ConfirmDialog.svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import XIcon from '@lucide/svelte/icons/x';

	let recipes = $state<Recipe[]>([]);
	let showForm = $state(false);
	let editingId = $state<number | null>(null);
	let name = $state('');
	let items = $state<RecipeItem[]>([]);
	let formError = $state('');
	let saved = $state<string | null>(null);
	let confirmRecipe = $state<Recipe | null>(null);
	let detail = $state<Recipe | null>(null);

	const totals = $derived(recipeTotals(items));

	onMount(() => {
		void refresh();
	});

	async function refresh() {
		recipes = await db.recipes.orderBy('name').toArray();
	}

	function macroLine(recipe: { items: RecipeItem[] }): string {
		const t = recipeTotals(recipe.items);
		return `${fmt(t.kcal, 0)} kcal · G ${fmt(t.fat)} · C ${fmt(t.carbs)} · F ${fmt(t.fiber)} · P ${fmt(t.protein)}`;
	}

	function addFood(food: Food, grams: number, _mealType: unknown, units?: number) {
		items = [...items, recipeItem(food, grams, units)];
		formError = '';
	}

	function removeItem(index: number) {
		items = items.filter((_, i) => i !== index);
	}

	function newRecipe() {
		editingId = null;
		name = '';
		items = [];
		formError = '';
		showForm = true;
	}

	function edit(recipe: Recipe) {
		editingId = recipe.id ?? null;
		name = recipe.name;
		items = recipe.items.map((item) => ({ ...item }));
		formError = '';
		showForm = true;
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	function cancel() {
		showForm = false;
		editingId = null;
		name = '';
		items = [];
		formError = '';
	}

	async function save() {
		const trimmed = name.trim();
		if (!trimmed) {
			formError = 'Ponle un nombre a la receta';
			return;
		}
		if (items.length === 0) {
			formError = 'Añade al menos un alimento';
			return;
		}
		const data = { name: trimmed, items: $state.snapshot(items) };
		if (editingId !== null) {
			await db.recipes.update(editingId, data);
		} else {
			await db.recipes.add({ ...data, createdAt: Date.now() });
		}
		cancel();
		saved = trimmed;
		await refresh();
	}

	async function remove(recipe: Recipe) {
		if (recipe.id === undefined) return;
		await db.recipes.delete(recipe.id);
		await refresh();
	}
</script>

<Card>
	<CardContent class="flex flex-col gap-3">
		<div class="flex items-center justify-between gap-2">
			<h2 class="text-base font-semibold">Recetas <span class="text-xs font-normal text-muted-foreground">· macros por ración</span></h2>
			<Button variant="outline" onclick={() => (showForm ? cancel() : newRecipe())}>
				{showForm ? 'Cancelar' : 'Nueva receta'}
			</Button>
		</div>
		{#if saved && !showForm}
			<p class="text-xs text-muted-foreground">«{saved}» guardada ✓</p>
		{/if}

		{#if showForm}
			<div class="flex flex-col gap-2.5 rounded-lg border border-border bg-card p-3">
				<h3 class="text-sm font-semibold">{editingId !== null ? 'Editar receta' : 'Nueva receta'}</h3>
				{#if formError}<p class="text-sm text-destructive">{formError}</p>{/if}
				<div>
					<Label class="mb-1 block">Nombre</Label>
					<Input bind:value={name} placeholder="Ej: Ensalada de garbanzos" />
					<p class="mt-1 text-xs text-muted-foreground">
						Una receta es una ración: pon las cantidades de un solo plato.
					</p>
				</div>
				<FoodPicker onAdd={addFood} showMealType={false} />
				{#if items.length > 0}
					<ul>
						{#each items as item, index (index)}
							<li class="flex items-center justify-between gap-2 border-b border-border py-2 last:border-b-0">
								<div class="flex min-w-0 flex-col gap-0.5">
									<strong class="text-sm">{item.name}</strong>
									<small class="text-xs text-muted-foreground">
										{#if item.units}{fmt(item.units)} ud · {/if}{fmt(item.grams)} g · {fmt(item.kcal, 0)} kcal
									</small>
								</div>
								<Button
									variant="ghost"
									size="icon-sm"
									class="text-destructive hover:text-destructive"
									onclick={() => removeItem(index)}
									title="Quitar de la receta"
									aria-label="Quitar de la receta"
								>
									<XIcon />
								</Button>
							</li>
						{/each}
					</ul>
					<p class="text-sm">
						<strong>Ración</strong>
						<span class="text-muted-foreground"> · {fmt(recipeGrams(items))} g · {macroLine({ items })}</span>
					</p>
				{/if}
				<Button onclick={save}>{editingId !== null ? 'Guardar cambios' : 'Guardar receta'}</Button>
			</div>
		{/if}

		{#if recipes.length === 0}
			<p class="text-sm text-muted-foreground">
				Aún no tienes recetas. Crea una combinando alimentos de tu base de datos; cada receta es una ración.
			</p>
		{:else}
			<ul>
				{#each recipes as recipe (recipe.id)}
					<li class="flex items-center justify-between gap-2 border-b border-border py-2.5 last:border-b-0">
						<button
							type="button"
							class="flex min-w-0 flex-1 flex-col gap-0.5 text-left"
							onclick={() => (detail = recipe)}
							title="Ver ingredientes"
						>
							<strong class="text-sm">{recipe.name}</strong>
							<small class="text-xs text-muted-foreground">{macroLine(recipe)}</small>
							<small class="text-xs text-muted-foreground">
								1 ración · {recipe.items.length} {recipe.items.length === 1 ? 'alimento' : 'alimentos'} · {fmt(recipeGrams(recipe.items))} g · ver ingredientes
							</small>
						</button>
						<div class="flex shrink-0 gap-1.5">
							<Button variant="ghost" size="icon-sm" onclick={() => edit(recipe)} title="Editar" aria-label="Editar">
								<PencilIcon />
							</Button>
							<Button
								variant="ghost"
								size="icon-sm"
								class="text-destructive hover:text-destructive"
								onclick={() => (confirmRecipe = recipe)}
								title="Eliminar"
								aria-label="Eliminar"
							>
								<Trash2Icon />
							</Button>
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	</CardContent>
</Card>

<Dialog.Root
	open={detail !== null}
	onOpenChange={(open) => {
		if (!open) detail = null;
	}}
>
	<Dialog.Content class="overflow-y-auto overscroll-contain">
		{#if detail}
			<Dialog.Header>
				<Dialog.Title>{detail.name}</Dialog.Title>
				<Dialog.Description>
					1 ración · {detail.items.length} {detail.items.length === 1 ? 'alimento' : 'alimentos'} · {fmt(recipeGrams(detail.items))} g
				</Dialog.Description>
			</Dialog.Header>
			<ul>
				{#each detail.items as item, index (index)}
					<li class="flex items-baseline justify-between gap-3 border-b border-border py-2 last:border-b-0">
						<span class="min-w-0 flex-1 text-sm">{item.name}</span>
						<span class="shrink-0 text-xs text-muted-foreground">
							{#if item.units}{fmt(item.units)} ud · {/if}{fmt(item.grams)} g · {fmt(item.kcal, 0)} kcal
						</span>
					</li>
				{/each}
			</ul>
			<p class="text-sm">
				<strong>Ración</strong>
				<span class="text-muted-foreground"> · {macroLine(detail)}</span>
			</p>
			<div class="flex justify-end">
				<Button
					variant="outline"
					onclick={() => {
						const recipe = detail;
						detail = null;
						if (recipe) edit(recipe);
					}}
				>Editar receta</Button>
			</div>
		{/if}
	</Dialog.Content>
</Dialog.Root>

<ConfirmDialog
	open={confirmRecipe !== null}
	title="Eliminar receta"
	message={confirmRecipe ? `¿Eliminar «${confirmRecipe.name}»? Esta acción no se puede deshacer.` : ''}
	onConfirm={async () => {
		if (confirmRecipe) await remove(confirmRecipe);
	}}
	onClose={() => (confirmRecipe = null)}
/>
