import type { Food } from './db';
import { fold } from './format.ts';

/**
 * Busca un alimento existente con el mismo nombre y marca (normalizados).
 * Comparación exacta: sirve para avisar de posibles duplicados, no para buscar.
 */
export function findFoodMatch(foods: Food[], name: string, brand?: string): Food | undefined {
	const targetName = fold(name.trim());
	const targetBrand = fold((brand ?? '').trim());
	return foods.find(
		(food) => fold(food.name.trim()) === targetName && fold((food.brand ?? '').trim()) === targetBrand
	);
}
