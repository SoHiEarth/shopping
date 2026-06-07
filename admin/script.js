import { escapeHtml, formatPrice, supabase } from '../module.js'

let warningDisplayed = false;
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

function parseOrderEntry(entry) {
  const trimmedEntry = String(entry ?? '').trim();
  if (!trimmedEntry || !trimmedEntry.includes(':')) {
    return null;
  }

  const [customerName, quantityText] = trimmedEntry.split(':');
  const quantity = Number.parseInt(quantityText, 10);

  if (!customerName || !Number.isFinite(quantity) || quantity <= 0) {
    return null;
  }

  return {
    customerName: customerName.trim(),
    quantity,
  };
}

function getTotalOrderCount(orders) {
  return String(orders ?? '')
    .split(/\r?\n/)
    .map(parseOrderEntry)
    .reduce((sum, order) => sum + (order?.quantity ?? 0), 0);
}

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
    
    const row = document.createElement('tr');
    row.id = `product${product.id}`;
    row.innerHTML = `
      <td>${escapeHtml(product.seller)}</td>
      <td>${escapeHtml(product.name)}</td>
      <td>${formatPrice(product.price)}</td>
      <td>${getTotalOrderCount(product.orders)}</td>
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

async function initializeAdminDashboard() {
  const isTokenValid = await validateToken();
  if (!isTokenValid) {
    return;
  }
  
  await loadProducts();
  const productTableBody = document.getElementById('product-table-body');
  if (productTableBody) {
    productTableBody.addEventListener('click', (event) => {
      const row = event.target.closest('tr');
      if (row) {
        const productId = row.id.replace('product', '');
        openEditPage(productId);
      }
    });
  }
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', () => {
    initializeAdminDashboard();
  }, { once: true });
} else {
  initializeAdminDashboard();
}