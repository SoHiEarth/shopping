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
    // if product price is null, add to warning list
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
    row.innerHTML = `
      <td>${escapeHtml(product.name)}</td>
      <td>${formatPrice(product.price)}</td>
      <td>${formatOrders(product.orders)}</td>
      <td>${product.stock}</td>
    `;
    // if price is null, add alert class to the price cell
    if (product.price === null) {
      row.children[1].classList.add('alert');
    }
    productList.appendChild(row);
  });
  // if there are no warnings, hide the warning section
  if (!warningDisplayed) {
    const warningContainer = document.getElementById('warning-container');
    warningContainer.style.display = 'none';
  }
}

// Load products when the page is loaded
window.addEventListener('DOMContentLoaded', loadProducts);