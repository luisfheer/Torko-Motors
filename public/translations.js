// Script para manejar traducciones en la aplicación
// Soporta español (es) e inglés (en)
const translations = {
    es: {
        // Navegación
        site_title: "Torko Motors",
        nav_catalog: "Catálogo",
        nav_cart: "Carrito",
        nav_admin: "Admin",
        nav_login: "Iniciar Sesión",
        nav_logout: "Cerrar Sesión",
        
        // Búsqueda y Filtros
        search_placeholder: "Buscar productos...",
        filter_category: "Categoría:",
        category_all: "Todas",
        category_motos: "Motos",
        category_repuestos: "Repuestos",
        category_accesorios: "Accesorios",
        filter_price: "Precio:",
        price_min: "Mínimo",
        price_max: "Máximo",
        filter_apply: "Aplicar",
        filter_clear: "Limpiar",
        
        // Productos
        loading: "Cargando productos...",
        no_products: "No se encontraron productos",
        price: "Precio",
        stock: "Stock",
        add_to_cart: "Agregar al Carrito",
        out_of_stock: "Agotado",
        
        // Autenticación
        login_title: "Iniciar Sesión",
        register_title: "Crear Cuenta",
        email_placeholder: "Email",
        password_placeholder: "Contraseña",
        name_placeholder: "Nombre completo",
        login_button: "Entrar",
        register_button: "Registrarse",
        no_account: "¿No tienes cuenta?",
        have_account: "¿Ya tienes cuenta?",
        register_link: "Regístrate",
        login_link: "Inicia sesión",
        login_success: "Inicio de sesión exitoso",
        login_error: "Error al iniciar sesión",
        register_success: "Registro exitoso. Ahora puedes iniciar sesión",
        register_error: "Error al registrarse",
        connection_error: "Error de conexión con el servidor",
        
        // Carrito
        cart_title: "Mi Carrito",
        cart_empty: "Tu carrito está vacío",
        cart_login_required: "Debes iniciar sesión para ver tu carrito",
        cart_total: "Total:",
        cart_clear: "Vaciar Carrito",
        subtotal: "Subtotal",
        update: "Actualizar",
        remove: "Eliminar",
        cart_updated: "Carrito actualizado",
        item_removed: "Producto eliminado del carrito",
        cart_cleared: "Carrito vaciado",
        invalid_quantity: "Cantidad inválida",
        update_error: "Error al actualizar",
        remove_error: "Error al eliminar",
        clear_error: "Error al vaciar el carrito",
        cart_load_error: "Error al cargar el carrito",
        confirm_remove: "¿Eliminar este producto del carrito?",
        confirm_clear_cart: "¿Estás seguro de vaciar todo el carrito?",
        added_to_cart: "Producto agregado al carrito",
        add_error: "Error al agregar al carrito",
        
        // Footer
        footer_rights: "Todos los derechos reservados.",
        
        // Información del usuario
        welcome: "Bienvenido",
        welcome_guest: "Bienvenido",
        
        // Panel de Administración
        admin_title: "Panel de Administración",
        admin_tab_products: "Gestión de Productos",
        admin_tab_users: "Ver Usuarios",
        admin_add_product: "Agregar Producto",
        admin_products_list: "Lista de Productos",
        admin_users_list: "Lista de Usuarios",
        admin_btn_add: "Agregar Producto",
        admin_btn_edit: "Editar",
        admin_btn_delete: "Eliminar",
        product_name: "Nombre del producto",
        product_description: "Descripción",
        product_price: "Precio",
        product_stock: "Stock",
        product_image: "Nombre de la imagen (ej: yamaha-mt07.jpg)",
        select_category: "Seleccionar categoría"
    },
    en: {
        // Navigation
        site_title: "Torko Motors",
        nav_catalog: "Catalog",
        nav_cart: "Cart",
        nav_admin: "Admin",
        nav_login: "Login",
        nav_logout: "Logout",
        
        // Search & Filters
        search_placeholder: "Search products...",
        filter_category: "Category:",
        category_all: "All",
        category_motos: "Motorcycles",
        category_repuestos: "Parts",
        category_accesorios: "Accessories",
        filter_price: "Price:",
        price_min: "Min",
        price_max: "Max",
        filter_apply: "Apply",
        filter_clear: "Clear",
        
        // Products
        loading: "Loading products...",
        no_products: "No products found",
        price: "Price",
        stock: "Stock",
        add_to_cart: "Add to Cart",
        out_of_stock: "Out of Stock",
        
        // Authentication
        login_title: "Login",
        register_title: "Create Account",
        email_placeholder: "Email",
        password_placeholder: "Password",
        name_placeholder: "Full name",
        login_button: "Login",
        register_button: "Register",
        no_account: "Don't have an account?",
        have_account: "Already have an account?",
        register_link: "Register",
        login_link: "Login",
        login_success: "Login successful",
        login_error: "Login error",
        register_success: "Registration successful. You can now login",
        register_error: "Registration error",
        connection_error: "Server connection error",
        
        // Cart
        cart_title: "My Cart",
        cart_empty: "Your cart is empty",
        cart_login_required: "You must login to view your cart",
        cart_total: "Total:",
        cart_clear: "Clear Cart",
        subtotal: "Subtotal",
        update: "Update",
        remove: "Remove",
        cart_updated: "Cart updated",
        item_removed: "Item removed from cart",
        cart_cleared: "Cart cleared",
        invalid_quantity: "Invalid quantity",
        update_error: "Update error",
        remove_error: "Remove error",
        clear_error: "Error clearing cart",
        cart_load_error: "Error loading cart",
        confirm_remove: "Remove this product from cart?",
        confirm_clear_cart: "Are you sure you want to clear the cart?",
        added_to_cart: "Product added to cart",
        add_error: "Error adding to cart",
        
        // Footer
        footer_rights: "All rights reserved.",
        
        // User info
        welcome: "Welcome",
        welcome_guest: "Welcome",
        
        // Admin Panel
        admin_title: "Admin Panel",
        admin_tab_products: "Product Management",
        admin_tab_users: "View Users",
        admin_add_product: "Add Product",
        admin_products_list: "Product List",
        admin_users_list: "User List",
        admin_btn_add: "Add Product",
        admin_btn_edit: "Edit",
        admin_btn_delete: "Delete",
        product_name: "Product name",
        product_description: "Description",
        product_price: "Price",
        product_stock: "Stock",
        product_image: "Image filename (e.g: yamaha-mt07.jpg)",
        select_category: "Select category"
    }
};

let currentLang = 'es';

// Obtener traduccion
function t(key) {
    return translations[currentLang][key] || key;
}

// Aplicar traducciones al DOM
function applyTranslations() {
    // Translate text content
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        el.textContent = t(key);
    });
    
    // Traducir placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        el.placeholder = t(key);
    });

    // Traducir contenido dinamico como "Bienvenido, [Nombre]"
    document.querySelectorAll('[data-i18n-dynamic]').forEach(el => {
        const key = el.getAttribute('data-i18n-dynamic');
        const userName = el.getAttribute('data-user-name');
        if (userName) {
            el.textContent = `${t(key)}, ${userName}`;
        }
    });
}

// Inicializar selector de idioma
function initLanguage() {
    const savedLang = localStorage.getItem('language') || 'es';
    currentLang = savedLang;
    
    const selector = document.getElementById('lang-selector');
    if (selector) {
        selector.value = currentLang;
        selector.addEventListener('change', (e) => {
            currentLang = e.target.value;
            localStorage.setItem('language', currentLang);
            applyTranslations();
        });
    }
    
    applyTranslations();
}