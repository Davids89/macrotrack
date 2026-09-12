export function round(value: number, digits = 1): number {
	return Math.round(value * 10 ** digits) / 10 ** digits;
}

const formatters = new Map<number, Intl.NumberFormat>();

function formatterFor(digits: number): Intl.NumberFormat {
	let formatter = formatters.get(digits);
	if (!formatter) {
		formatter = new Intl.NumberFormat('es-ES', { maximumFractionDigits: digits });
		formatters.set(digits, formatter);
	}
	return formatter;
}

export function fmt(value: number, digits = 1): string {
	const rounded = round(value, digits);
	return formatterFor(digits).format(rounded === 0 ? 0 : rounded);
}

const timeFormatter = new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit' });

export function fmtTime(ms: number): string {
	return timeFormatter.format(new Date(ms));
}

export function fold(s: string): string {
	return s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

export function toNumber(value: string): number {
	const s = String(value).trim();
	const normalized = s.includes(',') ? s.replace(/\./g, '').replace(',', '.') : s;
	const n = parseFloat(normalized);
	return Number.isNaN(n) ? NaN : n;
}
