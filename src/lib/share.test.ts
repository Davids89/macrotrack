import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decodeRecipe, encodeRecipe, recipeShareUrl } from './share.ts';

const RECIPE = {
	name: 'Guiso de garbanzos ñam',
	items: [
		{ name: 'Garbanzos', grams: 200, kcal: 328, protein: 17.2, carbs: 44.6, fat: 5.4, fiber: 12.8 },
		{ name: 'Huevo', grams: 120, kcal: 172, protein: 15, carbs: 1, fat: 12, fiber: 0, units: 2 }
	]
};

test('la receta sobrevive al viaje por el enlace', () => {
	const decoded = decodeRecipe(recipeShareUrl(RECIPE, 'https://macrotrack.app'));
	assert.equal(decoded?.name, RECIPE.name);
	assert.deepEqual(decoded?.items[0], { ...RECIPE.items[0], units: undefined });
	assert.equal(decoded?.items[1].units, 2);
});

test('cabe en un QR: menos de 2953 bytes', () => {
	const big = { name: 'Receta larga', items: Array.from({ length: 20 }, () => RECIPE.items[0]) };
	assert.ok(recipeShareUrl(big, 'https://macrotrack.app').length < 2953);
});

test('datos ajenos corruptos o inválidos no se importan', () => {
	assert.equal(decodeRecipe('no-es-base64!!'), null);
	assert.equal(decodeRecipe(encodeRecipe({ name: '  ', items: RECIPE.items })), null);
	assert.equal(decodeRecipe(encodeRecipe({ name: 'Vacía', items: [] })), null);
	assert.equal(decodeRecipe(btoa('["X",[["Sal","mucha",1,1,1,1,1]]]')), null);
});
