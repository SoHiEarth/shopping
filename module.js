import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'
const SUPABASE_URL = 'https://fqektoozvsosmqqraeog.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_W1QJyDateNq-fU8wmBPRmw_2TFiSwBB'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
window.supabase = supabase
export async function ensureAnonymousSession() {
	const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
	if (sessionError) {
		console.error('Error checking existing session:', sessionError);
	}
	if (sessionData?.session) {
		return sessionData.session;
	}
	const { data, error } = await supabase.auth.signInAnonymously();
	if (error) {
		console.error('Error signing in anonymously:', error);
		return null;
	}
	return data.session ?? null;
}

export function escapeHtml(value) {
	return String(value)
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');
}

export function formatPrice(value) {
	if (value === null || value === undefined || value === '') {
		return '未設定';
	}
	if (typeof value === 'number') {
		return `${value.toLocaleString('ja-JP')}円`;
	}
	const text = String(value);
	return text.includes('円') ? text : `${text}円`;
}

export function formatOrders(value) {
	if (value === null || value === undefined || value === '') {
		return '0';
	}
	if (typeof value === 'number') {
		return `${value}`;
	}
	return String(value);
}

export function setHeaderUsername(elementId = 'username', fallbackName = 'ゲストさん') {
	const urlParams = new URLSearchParams(window.location.search);
	const username = urlParams.get('username');
	if (!username) {
    window.location.href = '/login';
	}
	const usernameElement = document.getElementById(elementId);
	if (!usernameElement) {
		return;
	}
	usernameElement.textContent = username ? `${username}さん` : fallbackName;
}
