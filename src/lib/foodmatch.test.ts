import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findFoodMatch } from './foodmatch.ts';
import type { Food } from './db';

const food = (name: string, brand?: string): Food => ({
	name,
	brand,
	base: 100,
	kcal: 0,
	protein: 0,
	carbs: 0,
	fat: 0,
	fiber: 0,
	source: 'manual',
	createdAt: 0
});

test('findFoodMatch ignora mayúsculas y acentos', () => {
	const existing = food('Plátano');
	assert.equal(findFoodMatch([existing], 'platano'), existing);
});

test('findFoodMatch exige la misma marca', () => {
	const existing = food('Yogur', 'Hacendado');
	assert.equal(findFoodMatch([existing], 'Yogur', 'Mercadona'), undefined);
	assert.equal(findFoodMatch([existing], 'Yogur'), undefined);
});

test('findFoodMatch empareja sin marca cuando ambos están vacíos', () => {
	const existing = food('Arroz blanco cocido');
	assert.equal(findFoodMatch([existing], 'Arroz blanco cocido', undefined), existing);
});

test('findFoodMatch recorta espacios', () => {
	const existing = food('Avena', '  Quaker ');
	assert.equal(findFoodMatch([existing], ' avena ', 'quaker'), existing);
});

test('findFoodMatch devuelve undefined sin coincidencia', () => {
	assert.equal(findFoodMatch([food('Avena')], 'Arroz'), undefined);
});

test('findFoodMatch devuelve el primer coincidente', () => {
	const first = food('Leche entera');
	const second = food('Leche entera');
	assert.equal(findFoodMatch([first, second], 'Leche Entera'), first);
});
