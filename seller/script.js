import { ensureAnonymousSession, escapeHtml, formatOrders, setHeaderUsername, supabase } from '../module.js'

const anonymousSession = await ensureAnonymousSession()
if (anonymousSession?.user?.id) {
  console.log('Anonymous session ready with user ID:', anonymousSession.user.id)
}

setHeaderUsername('username', 'ゲストさん');

async function loadProducts() {
  const session = await ensureAnonymousSession();
  if (!session?.user?.id) {
    console.error('Anonymous session could not be established before loading seller products.');
  }

  const { data: products, error } = await supabase.from('items').select('*');
  if (error) {
    console.error('Error fetching products:', error);
    return;
  } else if (!products) {
    console.warn('No products found in the database.');
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

function initializeSellerDashboard() {
  setHeaderUsername('username', 'ゲストさん');
  loadProducts();

  const addProductButton = document.getElementById('add-product');
  if (addProductButton) {
    addProductButton.addEventListener('click', () => {
      window.location.href = 'add-item/index.html?username=' + encodeURIComponent(new URLSearchParams(window.location.search).get('username') || '');
    });
  }
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', initializeSellerDashboard, { once: true });
} else {
  initializeSellerDashboard();
}