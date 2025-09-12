const socket = io();

// Render dinámico
socket.on("productos", (data) => {
    const lista = document.getElementById("listaProductos");
    lista.innerHTML = "";
    data.forEach(prod => {
        lista.innerHTML += `
    <li>
        <strong>${prod.title}</strong>
        <br>
        <img src="${prod.thumbnails[0] || ''}" alt="${prod.title}">
        <br>
        <p>${prod.description}</p>
        <strong>$${prod.price}</strong>
    </li>
    `;
    });
});

// Enviar nuevo producto
document.getElementById('formProducto').addEventListener('submit', (e) => {
    e.preventDefault();
    const datos = Object.fromEntries(new FormData(e.target));
    datos.price = Number(datos.price);
    datos.stock = Number(datos.stock);
    datos.status = true;
    datos.thumbnails = [datos.thumbnails];
    socket.emit('nuevoProducto', datos);
    e.target.reset();
});

// Eliminar producto
document.getElementById('formEliminar').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = e.target.id.value;
    socket.emit('eliminarProducto', id);
    e.target.reset();
});
