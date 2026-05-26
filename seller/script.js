// Parse the username from the URL query parameters
const urlParams = new URLSearchParams(window.location.search);
const username = urlParams.get('username');

// Display the username in the header
if (username) {
  document.getElementById('username').textContent = username + 'さん';
} else {
  document.getElementById('username').textContent = 'ゲストさん';
}

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'
const supabase = createClient('https://fqektoozvsosmqqraeog.supabase.co', 'sb_publishable_W1QJyDateNq-fU8wmBPRmw_2TFiSwBB')

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatPrice(value) {
  if (value === null || value === undefined || value === '') {
    return '価格未設定';
  }
  if (typeof value === 'number') {
    return `${value.toLocaleString('ja-JP')}円`;
  }
  const text = String(value);
  return text.includes('円') ? text : `${text}円`;
}

function formatOrders(value) {
  if (value === null || value === undefined || value === '') {
    return '0';
  }
  if (typeof value === 'number') {
    return `${value}`;
  }
}

async function loadProducts() {
  const { data: products, error } = await supabase.from('items').select('*');
  if (error) {
    console.error('Error fetching products:', error);
    return;
  }
  const productList = document.getElementById('product-table-body');
  products.forEach((product) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${escapeHtml(product.name)}</td>
      <td>${formatOrders(product.orders)}</td>
      <td>${product.stock}</td>
    `;
    productList.appendChild(row);
  });
}

// Load products when the page is loaded
window.addEventListener('DOMContentLoaded', loadProducts);