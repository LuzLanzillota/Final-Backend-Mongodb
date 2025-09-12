router.get("/", async (req, res) => {
    try {
        let { limit = 2, page = 1, sort, query } = req.query;
        limit = parseInt(limit);
        page = parseInt(page);

        const filter = query
            ? { $or: [{ category: query }, { status: query === "true" }] }
            : {};

        const options = {
            limit,
            page,
            sort: sort ? { price: sort === "asc" ? 1 : -1 } : {}
        };

        const result = await Product.paginate(filter, options);

        res.render("products", {
            products: result.docs,
            totalPages: result.totalPages,
            prevPage: result.prevPage,
            nextPage: result.nextPage,
            page: result.page,
            hasPrevPage: result.hasPrevPage,
            hasNextPage: result.hasNextPage

        });
        console.log({
            page: result.page,
            totalPages: result.totalPages,
            prevPage: result.prevPage,
            nextPage: result.nextPage
        });

    } catch (error) {
        res.status(500).send("Error al cargar los productos");
    }
});
