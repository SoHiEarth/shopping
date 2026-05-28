import { supabase } from '../../module.js'

// extract product id from query string
const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get('id');

async function loadProduct() {
    const { data: products, error } = await supabase.from('items').select('*');
    if (error) {
      console.error('Error fetching products:', error);
      return;
    }
    
    // get the product at the specified id
    const product = products.find((p) => String(p.id) === String(productId));
    if (!product) {
      console.error('Product not found');
      return;
    }
    const productNameDisplay = document.getElementById('product-name-display');
    productNameDisplay.textContent = `${product.name}`;

    // fill the form with the product data
    document.getElementById('product-name').value = product.name || '';
    document.getElementById('product-price').value = product.price || '';
    document.getElementById('product-stock').value = product.stock || '';
}

async function updateProduct(event) {
    event.preventDefault();
    const name = document.getElementById('product-name').value;
    const price = document.getElementById('product-price').value;
    const stock = document.getElementById('product-stock').value;
    const { data, error } = await supabase      .from('items')
      .update({ name, price, stock })
      .eq('id', productId);
    if (error) {
      console.error('Error updating product:', error);
      alert('商品情報の更新に失敗しました。');
    } else {
      alert('商品情報を更新しました。');
    }
}

  function initializeEditPage() {
    const editForm = document.getElementById('edit-form');
    if (editForm) {
      editForm.addEventListener('submit', updateProduct);
    }

    loadProduct();
  }

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', initializeEditPage, { once: true });
  } else {
    initializeEditPage();
  }