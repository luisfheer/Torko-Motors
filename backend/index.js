
// CONFIGURACION BASE

const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors({
  origin: ["http://127.0.0.1:5500", "http://localhost:5500"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type"],
  credentials: true
}));
app.use(express.json());
app.use(express.static("public"));

// Conexión a la base de datos SQLite
const DB_PATH = path.join(__dirname, "tienda.db");
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error("Error al conectar a la base de datos:", err.message);
    } else {
        console.log("Conectado a la base de datos SQLite.");

        // Habilitacion WAL (Write-Ahead Logging)
        db.run("PRAGMA journal_mode = WAL;", (err) => {
            if (err) {
                console.error("No se pudo habilitar WAL:", err.message);
            } else {
                console.log("Modo WAL activado para mejorar concurrencia y evitar bloqueos.");
            }
        });
    }
});

// CREACION DE TABLAS

db.serialize(() => {
    db.run(`
     CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        rol TEXT DEFAULT 'cliente'
     );
    `);
    db.run(`
     CREATE TABLE IF NOT EXISTS productos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        precio REAL NOT NULL,
        descripcion TEXT,
        stock INTEGER DEFAULT 0
     );
    `);
    db.run(`
     CREATE TABLE IF NOT EXISTS carrito (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER NULL,
        producto_id INTEGER,
        cantidad INTEGER DEFAULT 1,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
        FOREIGN KEY (producto_id) REFERENCES productos(id)
     );
    `);
});

// RUTA DE PRUEBA

app.get("/", (req, res) => {
    res.send("API funcionando correctamente");
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));

// USUARIOS

// Registrar nuevo usuario (cliente por defecto)
app.post("/usuarios", (req, res) => {
    const { nombre, email, password } = req.body;

    if (!nombre || !email || !password) {
        return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }

    const query = `
        INSERT INTO usuarios (nombre, email, password, rol)
        VALUES (?, ?, ?, 'cliente')
    `;

    db.run(query, [nombre, email, password], function (err) {
        if (err) {
            console.error("Error al registrar usuario:", err.message);
            return res.status(500).json({ error: "No se pudo registrar el usuario (email duplicado o error interno)" });
        }

        res.status(201).json({
            mensaje: "Usuario registrado exitosamente",
            id: this.lastID
        });
    });
});

// Obtener usuario por ID
app.get("/usuarios/:id", (req, res) => {
    const { id } = req.params;

    db.get("SELECT id, nombre, email, rol FROM usuarios WHERE id = ?", [id], (err, usuario) => {
        if (err) {
            console.error("Error al obtener usuario:", err.message);
            return res.status(500).json({ error: "Error al buscar usuario" });
        }

        if (!usuario) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        res.status(200).json(usuario);
    });
});

// Verificar credenciales (login básico)
app.post("/login", (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email y contraseña son obligatorios" });
    }

    db.get(
        "SELECT id, nombre, email, rol FROM usuarios WHERE email = ? AND password = ?",
        [email, password],
        (err, usuario) => {
            if (err) {
                console.error("Error en login:", err.message);
                return res.status(500).json({ error: "Error interno del servidor" });
            }

            if (!usuario) {
                return res.status(401).json({ error: "Credenciales incorrectas" });
            }

            res.status(200).json({
                mensaje: "Inicio de sesión exitoso",
                usuario
            });
        }
    );
});

// Obtener todos los usuarios (solo admin)
app.get("/usuarios", (req, res) => {
  const { email } = req.query; // lo enviamos como query param para mayor seguridad

  db.get(`SELECT rol FROM usuarios WHERE email = ?`, [email], (err, row) => {
    if (err) return res.status(500).json({ error: "Error en la base de datos" });
    if (!row || row.rol !== "admin") {
      return res.status(403).json({ error: "Acceso denegado. Solo el administrador puede ver esta información." });
    }

    db.all(`SELECT id, nombre, email, rol FROM usuarios`, (err, usuarios) => {
      if (err) {
        res.status(500).json({ error: "Error al obtener los usuarios" });
      } else {
        res.json(usuarios);
      }
    });
  });
});

// PRODUCTOS

// Agregar un producto al catálogo (solo admin)
app.post("/productos", (req, res) => {
  const { email, nombre, descripcion, precio, stock, categoria } = req.body; // ← Agrega categoria aquí

  // Verificar si el usuario que envía la petición es admin
  db.get(`SELECT rol FROM usuarios WHERE email = ?`, [email], (err, row) => {
    if (err) return res.status(500).json({ error: "Error en la base de datos" });
    if (!row || row.rol !== "admin") {
      return res.status(403).json({ error: "Acceso denegado. Solo el administrador puede agregar productos." });
    }

    // Validar campos obligatorios
    if (!nombre || !precio || stock === undefined) {
      return res.status(400).json({ error: "Nombre, precio y stock son obligatorios." });
    }

    // Insertar el producto en la base de datos (CON CATEGORIA)
    db.run(
      `INSERT INTO productos (nombre, descripcion, precio, stock, categoria) VALUES (?, ?, ?, ?, ?)`,
      [nombre, descripcion || null, precio, stock, categoria || null], // ← Agrega categoria aquí
      function (err) {
        if (err) {
          return res.status(500).json({ error: "No se pudo registrar el producto" });
        }
        res.status(201).json({
          mensaje: "Producto agregado correctamente",
          id: this.lastID,
        });
      }
    );
  });
});

// Actualizar un producto existente (solo admin)
app.put("/productos/:id", (req, res) => {
  const { email, nombre, descripcion, precio, stock } = req.body;
  const { id } = req.params;

  // Verificar si el usuario es admin
  db.get(`SELECT rol FROM usuarios WHERE email = ?`, [email], (err, row) => {
    if (err) return res.status(500).json({ error: "Error en la base de datos" });
    if (!row || row.rol !== "admin") {
      return res.status(403).json({ error: "Acceso denegado. Solo el administrador puede actualizar productos." });
    }

    // Verificar que el producto exista
    db.get(`SELECT * FROM productos WHERE id = ?`, [id], (err, producto) => {
      if (err) return res.status(500).json({ error: "Error al buscar el producto" });
      if (!producto) return res.status(404).json({ error: "Producto no encontrado" });

      // Construir valores actualizados (si no se envía un campo, conserva el anterior)
      const nuevoNombre = nombre || producto.nombre;
      const nuevaDescripcion = descripcion || producto.descripcion;
      const nuevoPrecio = precio || producto.precio;
      const nuevoStock = stock !== undefined ? stock : producto.stock;

      // Ejecutar la actualización
      db.run(
        `UPDATE productos SET nombre = ?, descripcion = ?, precio = ?, stock = ? WHERE id = ?`,
        [nuevoNombre, nuevaDescripcion, nuevoPrecio, nuevoStock, id],
        function (err) {
          if (err) {
            return res.status(500).json({ error: "Error al actualizar el producto" });
          }
          res.json({ mensaje: "Producto actualizado correctamente" });
        }
      );
    });
  });
});

// Eliminar un producto del catálogo (solo admin)
app.delete("/productos/:id", (req, res) => {
  const { email } = req.body; // el email del admin que realiza la acción
  const { id } = req.params;  // ID del producto a eliminar

  // Verificar si el usuario es admin
  db.get(`SELECT rol FROM usuarios WHERE email = ?`, [email], (err, row) => {
    if (err) return res.status(500).json({ error: "Error en la base de datos" });
    if (!row || row.rol !== "admin") {
      return res.status(403).json({ error: "Acceso denegado. Solo el administrador puede eliminar productos." });
    }

    // Eliminar el producto
    db.run(`DELETE FROM productos WHERE id = ?`, [id], function(err) {
      if (err) {
        return res.status(500).json({ error: "Error al eliminar el producto" });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: "Producto no encontrado" });
      }
      res.json({ mensaje: "Producto eliminado correctamente" });
    });
  });
});

// obtener todos los productos de la DB
app.get("/productos", (req, res) => {
    db.all("SELECT * FROM productos", [], (err, rows) => {
        if (err) {
            console.error("Error al obtener productos:", err.message);
            return res.status(500).json({ error: "No se pudieron obtener los productos" });
        }
        res.json(rows);
    });
});

// obtener productos por ID
app.get("/productos/:id", (req, res) => {
    const id = req.params.id;

    db.get("SELECT * FROM productos WHERE id = ?", [id], (err, row) => {
        if (err) {
            console.error ("Error al obtener producto:", err.message);
            return res.status(500).json({ error: "No se pudo obtener el producto" });
        }
        if (!row) {
            return res.status(404).json({ error: "Producto no encontrado" });
        }
        res.json(row);
    });
});

// CARRITO DE COMPRAS

// Agregar producto al carrito
app.post("/carrito", (req, res) => {
    const { usuario_id, producto_id, cantidad } = req.body;
    const cantidadSolicitada = cantidad || 1;

    // Verificar existencia del producto y stock disponible
    db.get("SELECT * FROM productos WHERE id = ?", [producto_id], (err, producto) => {
        if (err) {
            console.error("Error al verificar producto:", err.message);
            return res.status(500).json({ error: "Error interno del servidor" });
        }
        if (!producto) {
            return res.status(404).json({ error: "Producto no encontrado" });
        }

        // Validación de stock
        if (producto.stock < cantidadSolicitada) {
            return res.status(400).json({
                error: `Stock insuficiente. Disponible: ${producto.stock}`
            });
        }

        // Agregar producto al carrito
        const query = `
            INSERT INTO carrito (usuario_id, producto_id, cantidad)
            VALUES (?, ?, ?)
        `;
        db.run(query, [usuario_id || null, producto_id, cantidadSolicitada], function (err) {
            if (err) {
                console.error("Error al agregar al carrito:", err.message);
                return res.status(500).json({ error: "No se pudo agregar al carrito" });
            }

            // Reducir stock del producto en la tabla productos
            db.run(
                "UPDATE productos SET stock = stock - ? WHERE id = ?",
                [cantidadSolicitada, producto_id],
                (err2) => {
                    if (err2) {
                        console.error("Error al actualizar stock:", err2.message);
                    }
                }
            );

            res.status(201).json({
                mensaje: "Producto agregado al carrito",
                producto_id: producto_id,
                cantidad: cantidadSolicitada
            });
        });
    });
});

// Obtener carrito de un usuario específico
app.get("/carrito/:usuario_id", (req, res) => {
    const { usuario_id } = req.params;

    const query = `
        SELECT 
            c.id AS carrito_id,
            p.id AS producto_id,
            p.nombre,
            p.precio,
            c.cantidad,
            (p.precio * c.cantidad) AS subtotal
        FROM carrito c
        JOIN productos p ON c.producto_id = p.id
        WHERE c.usuario_id = ?
    `;

    db.all(query, [usuario_id], (err, rows) => {
        if (err) {
            console.error("Error al obtener carrito:", err.message);
            return res.status(500).json({ error: "No se pudo obtener el carrito" });
        }

        if (rows.length === 0) {
            return res.status(200).json({ mensaje: "El carrito está vacío", productos: [] });
        }

        // Calcular total general del carrito
        const total = rows.reduce((acc, item) => acc + item.subtotal, 0);

        res.status(200).json({
            usuario_id,
            productos: rows,
            total
        });
    });
});

// Actualizar cantidad de un producto en el carrito
app.put("/carrito/:id", (req, res) => {
    const { cantidad } = req.body;
    const { id } = req.params;

    // Obtener el producto del carrito
    db.get("SELECT * FROM carrito WHERE id = ?", [id], (err, item) => {
        if (err) return res.status(500).json({ error: "Error al buscar en el carrito" });
        if (!item) return res.status(404).json({ error: "Producto no encontrado en el carrito" });

        // Obtener el producto en catálogo
        db.get("SELECT * FROM productos WHERE id = ?", [item.producto_id], (err, producto) => {
            if (err) return res.status(500).json({ error: "Error al obtener el producto" });
            if (!producto) return res.status(404).json({ error: "Producto no encontrado" });

            const diferencia = cantidad - item.cantidad;

            if (diferencia > 0 && producto.stock < diferencia) {
                return res.status(400).json({
                    error: `Stock insuficiente. Disponible: ${producto.stock}`
                });
            }

            // Actualizar la cantidad en el carrito
            db.run("UPDATE carrito SET cantidad = ? WHERE id = ?", [cantidad, id], (err) => {
                if (err) return res.status(500).json({ error: "Error al actualizar la cantidad" });

                // Actualizar el stock
                db.run("UPDATE productos SET stock = stock - ? WHERE id = ?", [diferencia, producto.id], (err2) => {
                    if (err2) console.error("Error al actualizar stock:", err2.message);
                });

                res.json({ mensaje: "Cantidad actualizada correctamente" });
            });
        });
    });
});

// Eliminar producto del carrito
app.delete("/carrito/:id", (req, res) => {
    const { id } = req.params;

    db.get("SELECT * FROM carrito WHERE id = ?", [id], (err, item) => {
        if (err) return res.status(500).json({ error: "Error al buscar en el carrito" });
        if (!item) return res.status(404).json({ error: "Producto no encontrado en el carrito" });

        // Devolver stock al inventario
        db.run("UPDATE productos SET stock = stock + ? WHERE id = ?", [item.cantidad, item.producto_id], (err2) => {
            if (err2) console.error("Error al devolver stock:", err2.message);
        });

        // Eliminar el producto del carrito
        db.run("DELETE FROM carrito WHERE id = ?", [id], (err) => {
            if (err) return res.status(500).json({ error: "Error al eliminar del carrito" });
            res.json({ mensaje: "Producto eliminado del carrito" });
        });
    });
});

// Vaciar el carrito completo de un usuario
app.delete("/carrito/usuario/:usuario_id", (req, res) => {
    const { usuario_id } = req.params;

    // Obtener todos los productos del carrito de ese usuario
    db.all("SELECT * FROM carrito WHERE usuario_id = ?", [usuario_id], (err, items) => {
        if (err) return res.status(500).json({ error: "Error al obtener el carrito" });

        // Devolver stock por cada producto
        items.forEach(item => {
            db.run("UPDATE productos SET stock = stock + ? WHERE id = ?", [item.cantidad, item.producto_id]);
        });

        // Vaciar el carrito
        db.run("DELETE FROM carrito WHERE usuario_id = ?", [usuario_id], (err2) => {
            if (err2) return res.status(500).json({ error: "Error al vaciar el carrito" });
            res.json({ mensaje: "Carrito vaciado correctamente" });
        });
    });
});

// Ver todos los carritos (solo admin)
app.get("/carritos", (req, res) => {
    const { rol } = req.query; // En el frontend enviarás rol=admin en la query

    if (rol !== "admin") {
        return res.status(403).json({ error: "Acceso denegado: solo administradores" });
    }

    const query = `
        SELECT 
            c.id AS carrito_id,
            u.nombre AS usuario,
            p.nombre AS producto,
            c.cantidad,
            (p.precio * c.cantidad) AS subtotal
        FROM carrito c
        JOIN usuarios u ON c.usuario_id = u.id
        JOIN productos p ON c.producto_id = p.id
    `;

    db.all(query, [], (err, rows) => {
        if (err) {
            console.error("Error al obtener carritos:", err.message);
            return res.status(500).json({ error: "Error al obtener carritos" });
        }

        res.status(200).json(rows);
    });
});

