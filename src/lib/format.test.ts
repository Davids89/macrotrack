import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fmt, fmtTime, toNumber } from './format.ts';

test('toNumber acepta coma y punto decimal', () => {
	assert.equal(toNumber('70,9'), 70.9);
	assert.equal(toNumber('70.9'), 70.9);
	assert.equal(toNumber('1.234,5'), 1234.5);
	assert.equal(toNumber(''), NaN);
	assert.equal(toNumber('abc'), NaN);
});

test('fmt usa formato español', () => {
	assert.equal(fmt(1000.6), '1000,6');
	assert.equal(fmt(2134), '2134');
	assert.equal(fmt(12345.6), '12.345,6');
	assert.equal(fmt(83.3), '83,3');
	assert.equal(fmt(-36.6), '-36,6');
	assert.equal(fmt(0.04), '0');
	assert.equal(fmt(1.375, 3), '1,375');
});

test('fmtTime usa hora de 24 horas', () => {
	assert.equal(fmtTime(new Date(2026, 0, 1, 8, 5).getTime()), '08:05');
	assert.equal(fmtTime(new Date(2026, 0, 1, 20, 30).getTime()), '20:30');
});