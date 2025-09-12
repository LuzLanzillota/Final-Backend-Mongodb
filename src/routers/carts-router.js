import { Router } from 'express';
import Cart from '../models/cart.model.js';
import Product from '../models/product.model.js';

const router = Router();

// Crear un nuevo carrito
router.post('/', async (req, res) => {
    try {
        const newCart = await Cart.create({ products: [] });
        res.status(201).json({ mensaje: "Carrito creado exitosamente", cart: newCart });
    } catch (error) {
        res.status(500).json({ error: "Error al crear el carrito", detalle: error.message });
    }
});

// Obtener productos de un carrito por ID (populate)
router.get('/:cid', async (req, res) => {
    try {
        const carrito = await Cart.findById(req.params.cid).populate("products.product").lean();

        if (!carrito) {
            return res.status(404).json({ error: "Carrito no encontrado" });
        }

        res.json({
            mensaje: "Productos del carrito encontrados",
            productos: carrito.products
        });
    } catch (error) {
        res.status(500).json({ error: "Error al obtener el carrito", detalle: error.message });
    }
});

// Agregar un producto a un carrito
router.post('/:cid/products/:pid', async (req, res) => {
    try {
        const { cid, pid } = req.params;

        // Verificar que el producto exista
        const producto = await Product.findById(pid);
        if (!producto) {
            return res.status(404).json({ error: "Producto no encontrado" });
        }

        // Buscar el carrito
        const carrito = await Cart.findById(cid);
        if (!carrito) {
            return res.status(404).json({ error: "Carrito no encontrado" });
        }

        // Ver si el producto ya existe en el carrito
        const item = carrito.products.find(p => p.product.toString() === pid);
        if (item) {
            item.quantity += 1;
        } else {
            carrito.products.push({ product: pid, quantity: 1 });
        }

        await carrito.save();
        res.json({ mensaje: "Producto agregado correctamente", cart: carrito });
    } catch (error) {
        res.status(500).json({ error: "Error al agregar el producto al carrito", detalle: error.message });
    }
});

// Actualizar cantidad de un producto en el carrito
router.put('/:cid/products/:pid', async (req, res) => {
    try {
        const { cid, pid } = req.params;
        const { quantity } = req.body;

        const carrito = await Cart.findById(cid);
        if (!carrito) return res.status(404).json({ error: "Carrito no encontrado" });

        const item = carrito.products.find(p => p.product.toString() === pid);
        if (!item) return res.status(404).json({ error: "Producto no encontrado en el carrito" });

        item.quantity = quantity;
        await carrito.save();

        res.json({ mensaje: "Cantidad actualizada", cart: carrito });
    } catch (error) {
        res.status(500).json({ error: "Error al actualizar el producto", detalle: error.message });
    }
});

// Reemplazar todos los productos de un carrito
router.put('/:cid', async (req, res) => {
    try {
        const { cid } = req.params;
        const { products } = req.body; // [{ product, quantity }]

        const carrito = await Cart.findByIdAndUpdate(
            cid,
            { products },
            { new: true }
        );

        if (!carrito) return res.status(404).json({ error: "Carrito no encontrado" });

        res.json({ mensaje: "Carrito actualizado", cart: carrito });
    } catch (error) {
        res.status(500).json({ error: "Error al actualizar el carrito", detalle: error.message });
    }
});

// Eliminar un producto de un carrito
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

// Vaciar un carrito
router.delete('/:cid', async (req, res) => {
    try {
        const { cid } = req.params;

        const carrito = await Cart.findByIdAndUpdate(cid, { products: [] }, { new: true });
        if (!carrito) return res.status(404).json({ error: "Carrito no encontrado" });

        res.json({ mensaje: "Carrito vaciado", cart: carrito });
    } catch (error) {
        res.status(500).json({ error: "Error al vaciar el carrito", detalle: error.message });
    }
});

export default router;
