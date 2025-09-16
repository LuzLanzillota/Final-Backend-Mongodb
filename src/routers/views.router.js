import { Router } from "express";
import Product from "../models/product.model.js";
import Cart from "../models/cart.model.js";

const router = Router();

// 📌 /products → lista con paginación
router.get("/products", async (req, res) => {
    try {
        let { limit = 10, page = 1, sort = null, query = null } = req.query;
        limit = parseInt(limit);
        page = parseInt(page);

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

        const result = await Product.paginate(filter, { ...options, lean: true });

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
            limit
        });
    } catch (err) {
        res.status(500).send("Error al cargar los productos");
    }
});

// 📌 /products/:pid → detalle del producto
router.get("/products/:pid", async (req, res) => {
    try {
        const { pid } = req.params;
        const product = await Product.findById(pid).lean();
        if (!product) return res.status(404).send("Producto no encontrado");

        res.render("productDetail", { product });
    } catch (err) {
        res.status(500).send("Error al cargar el producto");
    }
});

// 📌 /carts/:cid → vista del carrito
router.get("/carts/:cid", async (req, res) => {
    try {
        const { cid } = req.params;
        const cart = await Cart.findById(cid).populate("products.product").lean();
        if (!cart) return res.status(404).send("Carrito no encontrado");

        res.render("cart", { cart });
    } catch (err) {
        res.status(500).send("Error al cargar el carrito");
    }
});

export default router;
