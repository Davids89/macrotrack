import { foodAtGrams, sumTotals, type Totals } from './macros.ts';
import type { Food, RecipeItem } from './db';

/** Copia las macros del alimento en la receta, igual que hacen las entradas del diario:
 *  así la receta sobrevive a que el alimento se edite o se borre del catálogo. */
export function recipeItem(food: Food, grams: number, units?: number): RecipeItem {
	return { foodId: food.id, name: food.name, grams, units, ...foodAtGrams(food, grams) };
}

export function recipeTotals(items: RecipeItem[]): Totals {
	return {
		kcal: sumTotals(items, 'kcal'),
		fat: sumTotals(items, 'fat'),
		carbs: sumTotals(items, 'carbs'),
		fiber: sumTotals(items, 'fiber'),
		protein: sumTotals(items, 'protein')
	};
}

export function recipeGrams(items: RecipeItem[]): number {
	return items.reduce((acc, item) => acc + item.grams, 0);
}
