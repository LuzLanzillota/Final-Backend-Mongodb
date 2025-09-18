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
// Actualizar cantidad de un producto en el carrito
router.put('/:cid/products/:pid', async (req, res) => {
    try {
        const { cid, pid } = req.params;
        const { quantity } = req.body;

        const carrito = await Cart.findById(cid);
        if (!carrito) return res.status(404).json({ error: "Carrito no encontrado" });

        const productoEnCarrito = carrito.products.find(p => p.product.toString() === pid);
        if (!productoEnCarrito) return res.status(404).json({ error: "Producto no encontrado en el carrito" });

        productoEnCarrito.quantity = quantity;
        await carrito.save();

        res.json({ mensaje: "Cantidad actualizada", cart: carrito });
    } catch (error) {
        res.status(500).json({ error: "Error al actualizar cantidad", detalle: error.message });
    }
});


// Eliminar producto 
router.delete('/:cid/products/:pid', async (req, res) => {
    try {
        const { cid, pid } = req.params;
        const carrito = await Cart.findById(cid);
        if (!carrito) return res.status(404).json({ error: "Carrito no encontrado" });

        carrito.products = carrito.products.filter(p => p.product.toString() !== pid);
        await carrito.save();

        res.json({ mensaje: "Producto eliminado del carrito", cart: carrito });
    } catch (error) {
        res.status(500).json({ error: "Error al eliminar el producto", detalle: error.message });
    }
});


// Vaciar carrito 
router.delete('/:cid', async (req, res) => {
    try {
        const { cid } = req.params;
        const carrito = await Cart.findByIdAndUpdate(cid, { products: [] }, { new: true });
        if (!carrito) return res.status(404).json({ error: "Carrito no encontrado" });

        res.json({ mensaje: "Carrito vaciado", cart: carrito });
    } catch (error) {
        res.status(500).json({ error: "Error al vaciar carrito", detalle: error.message });
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
