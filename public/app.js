// API Configuration
const API_URL = 'http://localhost:4000';

// Global variables
let allProducts = [];
let filteredProducts = [];

// Inicialización del estado de autenticación
function initAuth() {
    const user = JSON.parse(localStorage.getItem('user'));
    const userInfo = document.getElementById('user-info');
    const loginLink = document.getElementById('login-link');
    const logoutBtn = document.getElementById('logout-btn');
    const adminLink = document.getElementById('admin-link');

    if (user && userInfo) {
        userInfo.textContent = `${t('welcome')}, ${user.nombre}`;
        userInfo.setAttribute('data-i18n-dynamic', 'welcome');
        userInfo.setAttribute('data-user-name', user.nombre);
        if (loginLink) loginLink.style.display = 'none';
        if (logoutBtn) {
            logoutBtn.style.display = 'inline-block';
            logoutBtn.addEventListener('click', logout);
        }
        // Mostrar enlace admin si el usuario es admin
        if (adminLink && user.rol === 'admin') {
            adminLink.style.display = 'inline-block';
        }
    } else {
        if (userInfo) {
            userInfo.textContent = t('welcome_guest');
            userInfo.setAttribute('data-i18n', 'welcome_guest');
        }
        if (loginLink) loginLink.style.display = 'inline-block';
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (adminLink) adminLink.style.display = 'none';
    }
}

// Función de logout
function logout() {
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

// Cargar todos los productos
async function loadProducts() {
    try {
        const response = await fetch(`${API_URL}/productos`);
        const data = await response.json();

        if (response.ok) {
            allProducts = data;
            filteredProducts = data;
            displayProducts(filteredProducts);
        } else {
            document.getElementById('products-container').innerHTML = 
                `<p class="error">${t('no_products')}</p>`;
        }
    } catch (error) {
        document.getElementById('products-container').innerHTML = 
            `<p class="error">${t('connection_error')}</p>`;
    }
}

// Mostrar productos
function displayProducts(products) {
    const container = document.getElementById('products-container');

    if (!products || products.length === 0) {
        container.innerHTML = `<p>${t('no_products')}</p>`;
        return;
    }

    container.innerHTML = products.map(product => `
        <div class="product-card">
            <img src="img/${product.imagen || 'default.png'}" 
                 alt="${product.nombre}" 
                 class="product-img"
                 onerror="this.src='img/default.png'">
            <h3>${product.nombre}</h3>
            <p>${product.descripcion || ''}</p>
            <p class="price">${product.precio.toFixed(2)}</p>
            <p class="stock">${t('stock')}: ${product.stock}</p>
            <button 
                onclick="addToCart(${product.id})" 
                ${product.stock === 0 ? 'disabled' : ''}
                data-i18n="${product.stock === 0 ? 'out_of_stock' : 'add_to_cart'}">
                ${product.stock === 0 ? t('out_of_stock') : t('add_to_cart')}
            </button>
        </div>
    `).join('');
}

// Agregar producto al carrito
async function addToCart(productId) {
    const user = JSON.parse(localStorage.getItem('user'));

    if (!user) {
        alert(t('cart_login_required'));
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/carrito`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                usuario_id: user.id,
                producto_id: productId,
                cantidad: 1
            })
        });

        const data = await response.json();

        if (response.ok) {
            alert(t('added_to_cart'));
            loadProducts(); // Reload to update stock
        } else {
            alert(data.error || t('add_error'));
        }
    } catch (error) {
        alert(t('connection_error'));
    }
}

// Configuración de filtros
function setupFilters() {
    const searchInput = document.getElementById('search-input');
    const categoryFilter = document.getElementById('category-filter');
    const applyBtn = document.getElementById('apply-filters');
    const clearBtn = document.getElementById('clear-filters');

    if (searchInput) {
        searchInput.addEventListener('input', filterProducts);
    }

    if (categoryFilter) {
        categoryFilter.addEventListener('change', filterProducts);
    }

    if (applyBtn) {
        applyBtn.addEventListener('click', filterProducts);
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', clearFilters);
    }
}

// Filtrar productos
function filterProducts() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const categorySelect = document.getElementById('category-filter');
    const category = categorySelect ? categorySelect.value.toLowerCase() : '';
    const minPrice = parseFloat(document.getElementById('min-price').value) || 0;
    const maxPrice = parseFloat(document.getElementById('max-price').value) || Infinity;

    filteredProducts = allProducts.filter(product => {
        const matchesSearch = product.nombre.toLowerCase().includes(searchTerm) ||
                            (product.descripcion && product.descripcion.toLowerCase().includes(searchTerm));
        
        // Filtro por categoría - verifica si el producto tiene el campo categoria
        let matchesCategory = true;
        if (category) {
            matchesCategory = (product.categoria && product.categoria.toLowerCase() === category) ||
                            product.nombre.toLowerCase().includes(category) ||
                            (product.descripcion && product.descripcion.toLowerCase().includes(category));
        }
        
        const matchesPrice = product.precio >= minPrice && product.precio <= maxPrice;

        return matchesSearch && matchesCategory && matchesPrice;
    });

    displayProducts(filteredProducts);
}

// Borrar filtros
function clearFilters() {
    document.getElementById('search-input').value = '';
    document.getElementById('category-filter').value = '';
    document.getElementById('min-price').value = '';
    document.getElementById('max-price').value = '';
    filteredProducts = allProducts;
    displayProducts(filteredProducts);
}