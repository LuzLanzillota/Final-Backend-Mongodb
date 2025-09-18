import { Router } from "express";
import Product from "../models/product.model.js";
import Cart from "../models/cart.model.js";

const router = Router();

// /products → lista con paginación y cartId en sesión
router.get("/products", async (req, res) => {
    try {
        let { limit = 10, page = 1, sort = null, query = null } = req.query;
        limit = parseInt(limit) || 10;
        page = parseInt(page) || 1;

        let filter = {};
        if (query) {
            if (query === "true" || query === "false") filter.status = query === "true";
            else filter.category = query;
        }

        const options = {
            limit,
            page,
            sort: sort ? { price: sort === "asc" ? 1 : -1 } : {}
        };

        // Si usás mongoose-paginate-v2
        const result = await Product.paginate(filter, { ...options, lean: true });

        // Aseguramos un cartId en sesión
        if (!req.session.cartId) {
            const newCart = await Cart.create({ products: [] });
            req.session.cartId = newCart._id.toString();
        }
        const cartId = req.session.cartId;

        res.render("products", {
            products: result.docs,
            page: result.page,
            totalPages: result.totalPages,
            hasPrevPage: result.hasPrevPage,
            hasNextPage: result.hasNextPage,
            prevPage: result.prevPage,
            nextPage: result.nextPage,
            query,
            sort,
            limit,
            cartId
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error al cargar los productos");
    }
});

// /products/:pid -> detalle con opción para elegir carrito (por si querés)
router.get("/products/:pid", async (req, res) => {
    try {
        const { pid } = req.params;
        const product = await Product.findById(pid).lean();
        if (!product) return res.status(404).send("Producto no encontrado");

        // Traigo todos los carritos (solo ids) por si querés seleccionar a cuál agregar
        const carts = await Cart.find().select("_id").lean();

        // Aseguramos cartId en sesión también
        if (!req.session.cartId) {
            const newCart = await Cart.create({ products: [] });
            req.session.cartId = newCart._id.toString();
        }
        const cartId = req.session.cartId;

        res.render("productDetail", { product, carts, cartId });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error al cargar el producto");
    }
});

// /carts/:cid -> vista del carrito (ya la tenías bien)
router.get("/carts/:cid", async (req, res) => {
    try {
        const { cid } = req.params;
        const cart = await Cart.findById(cid).populate("products.product").lean();
        if (!cart) return res.status(404).send("Carrito no encontrado");

        res.render("cart", { cart });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error al cargar el carrito");
    }
});

export default router;
