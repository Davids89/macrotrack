<script lang="ts">
	import { db, type Food, type MealType, MEAL_TYPES, suggestMealType } from '$lib/db';
	import { fmt, fold, toNumber } from '$lib/format';
	import { sortFavoritesFirst } from '$lib/favorites';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import { Select as SelectPrimitive } from 'bits-ui';
	import StarIcon from '@lucide/svelte/icons/star';
	import HistoryIcon from '@lucide/svelte/icons/history';

	const RECENT_DAYS = 7;
	const RECENT_LIMIT = 6;

	let {
		onAdd,
		initialMealType
	}: {
		onAdd: (food: Food, grams: number, mealType: MealType, units?: number) => void;
		initialMealType?: MealType;
	} = $props();

	const defaultMealType = () => initialMealType ?? suggestMealType();

	let query = $state('');
	let foods: Food[] = $state([]);
	let selected: Food | null = $state(null);
	let grams = $state('');
	let units = $state('');
	let mealType = $state<MealType>(defaultMealType());

	const results = $derived.by(() => {
		const q = fold(query);
		if (!q) return [];
		return sortFavoritesFirst(foods.filter((food) => fold(food.name).includes(q))).slice(0, 8);
	});

	let recentFoods = $state<Food[]>([]);

	$effect(() => {
		let cancelled = false;
		(async () => {
			const start = new Date();
			start.setDate(start.getDate() - (RECENT_DAYS - 1));
			const [all, entries] = await Promise.all([
				db.foods.toArray(),
				db.entries
					.where('date')
					.between(start.toLocaleDateString('en-CA'), new Date().toLocaleDateString('en-CA'), true, true)
					.toArray()
			]);
			if (cancelled) return;
			foods = all;
			const usage = new Map<number, { count: number; last: string }>();
			for (const entry of entries) {
				if (entry.foodId === undefined) continue;
				const current = usage.get(entry.foodId);
				if (current) {
					current.count += 1;
					current.last = entry.date;
				} else {
					usage.set(entry.foodId, { count: 1, last: entry.date });
				}
			}
			const byId = new Map(all.map((food) => [food.id!, food]));
			recentFoods = [...usage.entries()]
				.sort((a, b) => b[1].count - a[1].count || b[1].last.localeCompare(a[1].last))
				.map(([id]) => byId.get(id))
				.filter((food): food is Food => food !== undefined)
				.slice(0, RECENT_LIMIT);
		})();
		return () => {
			cancelled = true;
		};
	});

	function pick(food: Food) {
		selected = food;
		query = '';
		mealType = defaultMealType();
	}

	function add() {
		if (!selected) return;
		const byUnit = selected.unitSize !== undefined;
		const amount = byUnit ? toNumber(units) : toNumber(grams);
		if (!(amount > 0)) return;
		onAdd(selected, byUnit ? amount * selected.unitSize! : amount, mealType, byUnit ? amount : undefined);
		selected = null;
		grams = '';
		units = '';
		mealType = defaultMealType();
	}

	const canAdd = $derived.by(() => {
		const s = selected;
		if (!s) return false;
		return s.unitSize !== undefined ? toNumber(units) > 0 : toNumber(grams) > 0;
	});
</script>

<div class="flex flex-col gap-2">
	{#if recentFoods.length > 0}
		<div class="flex flex-wrap gap-1.5">
			{#each recentFoods as food (food.id)}
				<Button variant="outline" size="xs" class="max-w-full" onclick={() => pick(food)}>
					<HistoryIcon class="text-muted-foreground" />
					<span class="truncate">{food.name}</span>
				</Button>
			{/each}
		</div>
	{/if}
	<Input type="search" placeholder="Buscar alimento…" bind:value={query} />
	{#if results.length > 0}
		<ul class="max-h-64 flex flex-col gap-1 overflow-auto">
			{#each results as food (food.id)}
				<li>
					<Button variant="ghost" class="h-auto min-h-8 w-full items-start justify-between gap-2 py-2 font-normal" onclick={() => pick(food)}>
						<span class="min-w-0 flex-1 whitespace-normal break-words text-left">
							{#if food.favorite}<StarIcon class="mr-1 inline-block size-3.5 -translate-y-px text-yellow-500" fill="currentColor" />{/if}
							{food.name}
						</span>
						{#if food.brand}
							<span class="max-w-[40%] shrink-0 truncate text-xs text-muted-foreground">{food.brand}</span>
						{/if}
						<span class="shrink-0 text-xs text-muted-foreground">{fmt(food.kcal)} kcal / {food.base}g</span>
					</Button>
				</li>
			{/each}
		</ul>
	{/if}
	{#if selected}
		<div class="flex flex-col gap-2.5 rounded-lg border border-border bg-card p-3">
			<div class="flex items-center justify-between gap-2">
				<strong class="min-w-0 flex-1 truncate text-sm">
					{selected.name}
				</strong>
				{#if selected.brand}
					<span class="max-w-[40%] shrink-0 truncate text-xs text-muted-foreground">{selected.brand}</span>
				{/if}
				{#if selected.unitSize}
				<small class="shrink-0 text-muted-foreground">1 ud = {fmt(selected.unitSize)} g</small>
			{:else}
				<small class="shrink-0 text-muted-foreground">{fmt(selected.kcal)} kcal / {selected.base}g</small>
			{/if}
			</div>
			<div class="flex items-end gap-2">
				<div class="min-w-0 flex-1">
					{#if selected.unitSize}
						<Label class="mb-1 block">Unidades</Label>
						<Input type="text" min="0.1" bind:value={units} inputmode="decimal" />
					{:else}
						<Label class="mb-1 block">Gramos</Label>
						<Input type="text" min="1" bind:value={grams} inputmode="decimal" />
					{/if}
				</div>
				<div class="min-w-0 flex-1">
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
				<Button onclick={add} disabled={!canAdd}>Añadir</Button>
			</div>
		</div>
	{/if}
</div>
