const getCartId = async () => {
    let cartId = localStorage.getItem("cartId");

    if (cartId) {
        try {
            const resp = await fetch(`http://localhost:8080/api/carts/${cartId}`);
            if (resp.ok) {
                console.log("📦 Usando carrito existente:", cartId);
                return cartId;
            } else {
                console.warn("⚠️ Carrito guardado no existe en DB, creando uno nuevo...");
                localStorage.removeItem("cartId");
                cartId = null;
            }
        } catch (err) {
            console.error("Error verificando carrito:", err);
            localStorage.removeItem("cartId");
            cartId = null;
        }
    }

    if (!cartId) {
        const resp = await fetch("http://localhost:8080/api/carts", { method: "POST" });
        if (!resp.ok) throw new Error("No se pudo crear el carrito");

        const data = await resp.json();
        cartId = data.cart._id;
        localStorage.setItem("cartId", cartId);
        console.log("🛒 Nuevo carrito creado:", cartId);
    }

    return cartId;
};


const addToCart = async (pid, quantity = 1) => {
    try {
        const cid = await getCartId();

        console.log(`➡️ Agregando producto ${pid} al carrito ${cid}`);

        const response = await fetch(`http://localhost:8080/api/carts/${cid}/products/${pid}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ quantity })
        });

        if (!response.ok) throw new Error("Error al agregar producto al carrito");

        const data = await response.json();
        console.log("✅ Producto agregado al carrito:", data.cart);
    } catch (error) {
        console.error("❌ Error en addToCart:", error.message);
    }
};


