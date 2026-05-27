import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'
const supabase = createClient('https://fqektoozvsosmqqraeog.supabase.co', 'sb_publishable_W1QJyDateNq-fU8wmBPRmw_2TFiSwBB')

// Get token from URL
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');

async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));

  return hashArray
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function validateToken() {
  if (!token) {
    window.location.href = '../login/index.html';
    return false;
  }

  const hash = await sha256(token);
  const { data, error } = await supabase
    .from('tokens')
    .select('id')
    .eq('hash', hash)
    .single();

  if (error || !data) {
    window.location.href = '../login/index.html';
    return false;
  }

  localStorage.setItem('adminToken', token);

  return true;
}

validateToken();

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

// Retrieve items from the database and display them in the admin interface
let warningDisplayed = false;
async function loadProducts() {
  const { data: products, error } = await supabase.from('items').select('*');
  if (error) {
    console.error('Error fetching products:', error);
    return;
  }
  const productList = document.getElementById('product-table-body');
  products.forEach((product) => {
    if (product.price === null) {
      const warningList = document.getElementById('warning-list');
      const warningItem = document.createElement('li');
      warningItem.textContent = product.name;
      warningList.appendChild(warningItem);
      if (!warningDisplayed) {
        warningDisplayed = true;
      }
    }
    // Create element with id set to supabase id
    const row = document.createElement('tr');
    row.id = `product${product.id}`;
    row.innerHTML = `
      <td>${escapeHtml(product.seller)}</td>
      <td>${escapeHtml(product.name)}</td>
      <td>${formatPrice(product.price)}</td>
      <td>${formatOrders(product.orders)}</td>
      <td>${product.stock}</td>
    `;
    if (product.price === null) {
      row.children[1].classList.add('alert');
    }
    productList.appendChild(row);
  });
  if (!warningDisplayed) {
    const warningContainer = document.getElementById('warning-container');
    warningContainer.style.display = 'none';
  }
}

function openEditPage(productId) {
  const url = `edit/index.html?id=${encodeURIComponent(productId)}`;
  window.open(url, '_blank');
}

window.addEventListener('DOMContentLoaded', loadProducts);

document.getElementById('product-table-body').addEventListener('click', (event) => {
  const row = event.target.closest('tr');
  if (row) {
    const productId = row.id.replace('product', '');
    openEditPage(productId);
  }
});