import { Router } from 'express';
import Cart from '../models/cart.model.js';

const router = Router();

// Crear un nuevo carrito (API)
router.post('/', async (req, res) => {
    try {
        const newCart = await Cart.create({ products: [] });
        res.status(201).json({ mensaje: "Carrito creado exitosamente", cart: newCart });
    } catch (error) {
        res.status(500).json({ error: "Error al crear el carrito", detalle: error.message });
    }
});

// Obtener productos de un carrito (JSON - API)
router.get('/:cid', async (req, res) => {
    try {
        const carrito = await Cart.findById(req.params.cid).populate("products.product").lean();
        if (!carrito) return res.status(404).json({ error: "Carrito no encontrado" });
        res.json({ mensaje: "Productos del carrito encontrados", productos: carrito.products });
    } catch (error) {
        res.status(500).json({ error: "Error al obtener el carrito", detalle: error.message });
    }
});

// Agregar producto al carrito (API)
router.post('/:cid/products/:pid', async (req, res) => {
    try {
        const { cid, pid } = req.params;
        let { quantity } = req.body;
        quantity = Number(quantity) || 1;

        const carrito = await Cart.findById(cid);
        if (!carrito) return res.status(404).json({ error: "Carrito no encontrado" });

        const item = carrito.products.find(p => p.product.toString() === pid);
        if (item) {
            item.quantity += quantity;
        } else {
            carrito.products.push({ product: pid, quantity });
        }

        await carrito.save();

        // 🔑 importante → devolvemos con populate
        const carritoActualizado = await Cart.findById(cid).populate("products.product");

        res.json({ mensaje: "Producto agregado correctamente", cart: carritoActualizado });
    } catch (error) {
        res.status(500).json({ error: "Error al agregar producto", detalle: error.message });
    }
});

// Reemplazar todos los productos (API)
router.put('/:cid', async (req, res) => {
    try {
        const { cid } = req.params;
        const { products } = req.body;

        const carrito = await Cart.findByIdAndUpdate(cid, { products }, { new: true });
        if (!carrito) return res.status(404).json({ error: "Carrito no encontrado" });

        res.json({ mensaje: "Carrito actualizado", cart: carrito });
    } catch (error) {
        res.status(500).json({ error: "Error al actualizar el carrito", detalle: error.message });
    }
});

// Eliminar producto (API - resta 1 unidad)
router.delete('/:cid/products/:pid', async (req, res) => {
    try {
        const { cid, pid } = req.params;
        const carrito = await Cart.findById(cid);
        if (!carrito) return res.status(404).json({ error: "Carrito no encontrado" });

        const productoEnCarrito = carrito.products.find(p => p.product.toString() === pid);
        if (!productoEnCarrito) {
            return res.status(404).json({ error: "Producto no encontrado en el carrito" });
        }

        if (productoEnCarrito.quantity > 1) {
            productoEnCarrito.quantity -= 1;
        } else {
            carrito.products = carrito.products.filter(p => p.product.toString() !== pid);
        }

        await carrito.save();
        res.json({ mensaje: "Producto eliminado", cart: carrito });
    } catch (error) {
        res.status(500).json({ error: "Error al eliminar el producto", detalle: error.message });
    }
});

// Vaciar carrito (SSR)
router.post('/:cid/clear', async (req, res) => {
    try {
        const { cid } = req.params;
        const carrito = await Cart.findByIdAndUpdate(cid, { products: [] }, { new: true });
        if (!carrito) return res.status(404).send("Carrito no encontrado");

        res.redirect(`/api/carts/${cid}/view`);
    } catch (error) {
        res.status(500).send("Error al vaciar el carrito");
    }
});

// Mostrar carrito con Handlebars (SSR)
router.get('/:cid/view', async (req, res) => {
    try {
        const carrito = await Cart.findById(req.params.cid).populate("products.product").lean();
        if (!carrito) return res.status(404).send("Carrito no encontrado");

        res.render("cart", { cart: carrito });
    } catch (error) {
        res.status(500).send("Error al cargar el carrito");
    }
});

// Eliminar producto y redirigir (SSR)
router.post('/:cid/products/:pid/delete', async (req, res) => {
    try {
        const { cid, pid } = req.params;
        const carrito = await Cart.findById(cid);
        if (!carrito) return res.status(404).send("Carrito no encontrado");

        carrito.products = carrito.products.filter(p => p.product.toString() !== pid);
        await carrito.save();

        res.redirect(`/api/carts/${cid}/view`);
    } catch (error) {
        res.status(500).send("Error al eliminar el producto");
    }
});

export default router;
