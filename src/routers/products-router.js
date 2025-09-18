import { Router } from 'express';
import Product from '../models/product.model.js';
import Handlebars from "handlebars";
const router = Router();

// ✅ Obtener productos con paginación, filtros y ordenamiento
router.get('/', async (req, res) => {
    try {
        let { limit = 10, page = 1, sort, query } = req.query;
        limit = parseInt(limit);
        page = parseInt(page);

        // Filtro: por categoría o disponibilidad (status)
        const filter = query
            ? { $or: [{ category: query }, { status: query === "true" }] }
            : {};

        // Opciones de paginación
        const options = {
            limit,
            page,
            sort: sort ? { price: sort === "asc" ? 1 : -1 } : {}
        };

        const result = await Product.paginate(filter, options);

        res.json({
            status: "success",
            payload: result.docs,
            totalPages: result.totalPages,
            prevPage: result.prevPage,
            nextPage: result.nextPage,
            page: result.page,
            hasPrevPage: result.hasPrevPage,
            hasNextPage: result.hasNextPage,
            prevLink: result.hasPrevPage ? `/api/products?page=${result.prevPage}` : null,
            nextLink: result.hasNextPage ? `/api/products?page=${result.nextPage}` : null
        });
    } catch (error) {
        res.status(500).json({ status: "error", error: error.message });
    }
});

// ✅ Obtener un producto por ID
router.get('/:pid', async (req, res) => {
    try {
        const { pid } = req.params;
        const product = await Product.findById(pid);
        if (!product) {
            return res.status(404).json({ status: "error", error: "Perfume no encontrado" });
        }
        res.json(product);
    } catch (error) {
        res.status(500).json({ status: "error", error: error.message });
    }
});

// ✅ Agregar producto
router.post('/', async (req, res) => {
    try {
        const perfume = req.body;
        const nuevoProducto = await Product.create(perfume);
        res.status(201).json({
            status: "Exitoso",
            message: "Perfume creado correctamente",
            perfume: nuevoProducto
        });
    } catch (error) {
        res.status(500).json({ status: "error", error: error.message });
    }
});

// ✅ Actualizar producto
router.put('/:pid', async (req, res) => {
    try {
        const { pid } = req.params;
        const productoActualizado = req.body;
        const updated = await Product.findByIdAndUpdate(pid, productoActualizado, { new: true });

        if (!updated) {
            return res.status(404).json({ status: "error", error: "Producto no encontrado" });
        }

        res.json({
            status: "Exitoso",
            message: "Perfume correctamente actualizado",
            perfume: updated
        });
    } catch (error) {
        res.status(500).json({ status: "error", error: error.message });
    }
});

// ✅ Eliminar producto
router.delete('/:pid', async (req, res) => {
    try {
        const { pid } = req.params;
        const deleted = await Product.findByIdAndDelete(pid);

        if (!deleted) {
            return res.status(404).json({ status: "error", error: "Producto no encontrado" });
        }

        res.json({ status: "Exitoso", message: "Perfume eliminado" });
    } catch (error) {
        res.status(500).json({ status: "error", error: error.message });
    }
});

router.get("/view", async (req, res) => {
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
            sort: sort ? { price: sort === "asc" ? 1 : -1 } : { price: 1 }
        };

        const result = await Product.paginate(filter, options);

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
        console.error(err);
        res.status(500).send("Error al cargar los productos");
    }
});

Handlebars.registerHelper("eq", function (a, b) {
  return a === b;
});

Handlebars.registerHelper("categoria", function (cat) {
    if (cat === "F") return "Femenino";
    if (cat === "M") return "Masculino";
    return "Unisex";
});

export default router;
