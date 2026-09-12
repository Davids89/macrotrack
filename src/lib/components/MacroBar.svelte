<script lang="ts">
	import { fmt } from '$lib/format';
	import { Progress } from '$lib/components/ui/progress';
	import { cn } from '$lib/utils';
	import type { ChartDirection } from '$lib/chart';

	let {
		label,
		value,
		goal,
		unit,
		direction = 'max'
	}: { label: string; value: number; goal: number; unit: string; direction?: ChartDirection } = $props();

	const ratio = $derived(goal > 0 ? value / goal : 0);
	const pct = $derived(Math.min(100, ratio * 100));
	const remaining = $derived(goal - value);
	const reached = $derived(remaining <= 0);

	type State = 'pending' | 'near' | 'ok' | 'over';
	const state = $derived.by((): State => {
		if (direction === 'max') {
			if (reached) return 'over';
			return ratio >= 0.9 ? 'near' : 'pending';
		}
		if (reached) return 'ok';
		return ratio >= 0.8 ? 'near' : 'pending';
	});

	const stateText = $derived(
		state === 'over'
			? 'text-destructive'
			: state === 'ok'
				? 'text-primary'
				: state === 'near'
					? 'text-amber-400'
					: 'text-foreground'
	);
	const stateBar = $derived(
		state === 'over'
			? '[&_[data-slot=progress-indicator]]:bg-destructive'
			: state === 'near'
				? '[&_[data-slot=progress-indicator]]:bg-amber-400'
				: direction === 'min' && state === 'pending'
					? '[&_[data-slot=progress-indicator]]:bg-muted-foreground'
					: ''
	);
	const deltaLabel = $derived.by(() => {
		if (direction === 'max' && reached) return `+${fmt(-remaining)} ${unit}`;
		if (direction === 'min' && reached) return '✓ objetivo';
		return `faltan ${fmt(remaining)} ${unit}`;
	});
</script>

<div class="space-y-1">
	<div class="flex items-baseline justify-between gap-2 text-sm">
		<span class="text-muted-foreground">{label}</span>
		<span class="flex items-baseline gap-1.5">
			<span class={cn('font-semibold tabular-nums', stateText)}>
				{fmt(value)} <span class="font-normal text-muted-foreground">/ {fmt(goal)} {unit}</span>
			</span>
			<span class={cn('text-xs font-medium tabular-nums', state === 'pending' ? 'text-muted-foreground' : stateText)}>
				{deltaLabel}
			</span>
		</span>
	</div>
	<Progress value={pct} class={cn('h-1.5', stateBar)} />
</div>
