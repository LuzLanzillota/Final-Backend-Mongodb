import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { engine } from 'express-handlebars';
import mongoose from 'mongoose';

import productsRouter from './routers/products-router.js';
import cartsRouter from './routers/carts-router.js';
import Product from './models/product.model.js';
import Cart from './models/cart.model.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

const PORT = 8080;

// Conexión a Mongo
const MONGO_URL = "mongodb+srv://Luz:1234@cluster0.obgdwct.mongodb.net/Basedeperfumes?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(MONGO_URL)
    .then(() => console.log("✅ Conectado a MongoDB"))
    .catch(err => console.error("❌ Error conectando a Mongo:", err));

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/products', productsRouter);
app.use('/api/carts', cartsRouter);
app.use(express.static('./public')); // para servir JS del cliente

// Handlebars config
app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', './views');

// Rutas vistas
app.get('/', async (req, res) => {
    const products = await Product.find().lean();
    res.render('home', { products });
});

app.get('/realtimeproducts', async (req, res) => {
    const products = await Product.find().lean();
    res.render('realTimeProducts', { products });
});

// Websockets
io.on('connection', async (socket) => {
    console.log('🔌 Cliente conectado');

    // Enviar productos iniciales desde Mongo
    socket.emit('productos', await Product.find().lean());

    // Escuchar nuevo producto
    socket.on('nuevoProducto', async (producto) => {
        await Product.create(producto);
        io.emit('productos', await Product.find().lean());
    });

    // Escuchar eliminación
    socket.on('eliminarProducto', async (id) => {
        await Product.findByIdAndDelete(id);
        io.emit('productos', await Product.find().lean());
    });
});

// Iniciar servidor
httpServer.listen(PORT, () => console.log("🚀 Servidor escuchando en puerto " + PORT));
