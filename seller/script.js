import {
  ensureAnonymousSession,
  escapeHtml,
  formatOrders,
  setHeaderUsername,
  supabase,
} from '../module.js';

const params = new URLSearchParams(window.location.search);
const sellerUsername = params.get('username') || '';

let currentProductId = null;

// Modal elements
const modal = document.getElementById('product-details-modal');
const form = document.getElementById('product-details-form');
const nameInput = document.getElementById('product-name');
const orderInput = document.getElementById('order-count');
const stockInput = document.getElementById('stock-input');
const descInput = document.getElementById('description-input');
const closeButton = document.getElementById('close-button');
const submitButton = document.getElementById('submit-button');
const productTableBody = document.getElementById('product-table-body');

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

async function initializeSession() {
  const session = await ensureAnonymousSession();

  if (!session?.user?.id) {
    console.error('Failed to establish anonymous session.');
    return null;
  }

  console.log('Anonymous session ready:', session.user.id);
  return session;
}

async function loadProducts() {
  const { data: products, error } = await supabase
    .from('items')
    .select('*');

  if (error) {
    console.error('Error fetching products:', error);
    return;
  }

  if (!products?.length) {
    console.warn('No products found.');
    return;
  }

  productTableBody.innerHTML = '';

  products
    .filter(product => product.seller === sellerUsername)
    .forEach(product => {
      const row = document.createElement('tr');

      row.innerHTML = `
        <td>${escapeHtml(product.name)}</td>
        <td>${getTotalOrderCount(product.orders)}</td>
        <td>${Number(product.stock) || 0}</td>
      `;

      row.style.cursor = 'pointer';
      row.addEventListener('click', () => openProductModal(product.id));

      productTableBody.appendChild(row);
    });
}

async function openProductModal(productId) {
  currentProductId = productId;

  const { data, error } = await supabase
    .from('items')
    .select('*')
    .eq('id', productId)
    .single();

  if (error) {
    console.error('Failed to fetch product:', error);
    return;
  }

  nameInput.value = data.name ?? '';
  orderInput.value = getTotalOrderCount(data.orders);
  
  stockInput.value = Number(data.stock) || 0;

  orderInput.readOnly = true;

  descInput.value = data.description ?? '';

  modal.style.display = 'flex';
}

function closeModal() {
  modal.style.display = 'none';
  currentProductId = null;
}

async function saveProduct(event) {
  event.preventDefault();

  if (!currentProductId) return;

  const updates = {
    name: nameInput.value.trim(),
    stock: Number(stockInput.value) || 0,
    description: descInput.value.trim(),
  };

  const { error } = await supabase
    .from('items')
    .update(updates)
    .eq('id', currentProductId)
    .eq('seller', sellerUsername);

  if (error) {
    console.error('Failed to update product:', error);
    alert(`更新に失敗しました: ${error.message}`);
    return;
  }

  alert('商品を更新しました。');

  await loadProducts();
  closeModal();
}

function initializeModal() {
  if (!modal || !form) return;

  submitButton.type = 'button';

  closeButton.addEventListener('click', closeModal);

  submitButton.addEventListener('click', saveProduct);
  form.addEventListener('submit', saveProduct);

  modal.addEventListener('click', event => {
    if (event.target === modal) {
      closeModal();
    }
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && modal.style.display === 'flex') {
      closeModal();
    }
  });
}

function initializeSellerDashboard() {
  setHeaderUsername('username', 'ゲストさん');

  loadProducts();

  document
    .getElementById('add-product')
    ?.addEventListener('click', () => {
      window.location.href =
        `add-item/index.html?username=${encodeURIComponent(sellerUsername)}`;
    });
}

async function initialize() {
  await initializeSession();

  initializeModal();
  initializeSellerDashboard();
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', initialize, { once: true });
} else {
  initialize();
}