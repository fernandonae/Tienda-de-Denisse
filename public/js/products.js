fetch('/api/products')
  .then(res => res.json())
  .then(data => {
    const list = document.getElementById('product-list');

    data.forEach(product => {
      const li = document.createElement('li');
      li.textContent = `${product.name} - $${product.price} (Stock: ${product.stock})`;
      list.appendChild(li);
    });
  })
  .catch(err => console.error(err));
