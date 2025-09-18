import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { engine } from 'express-handlebars';
import mongoose from 'mongoose';
import productsRouter from './routers/products-router.js';
import cartsRouter from './routers/carts-router.js';
import viewsRouter from './routers/views.router.js';
import Product from './models/product.model.js';
import methodOverride from 'method-override';
import session from 'express-session';


const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);
const PORT = 8080;

// Conexión a Mongo
const MONGO_URL = "mongodb+srv://Luz:1234@cluster0.obgdwct.mongodb.net/Basedeperfumes?retryWrites=true&w=majority&appName=Cluster0";
mongoose.connect(MONGO_URL)
    .then(() => console.log("✅ Conectado a MongoDB"))
    .catch(err => console.error("❌ Error conectando a Mongo:", err));

// Middlewares IMPORTANTES: poner antes de montar routers que los usan
app.use(methodOverride('_method'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: 'un-secreto-cualquiera',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

app.use(express.static('./public'));

// Mount routers (ahora ya con session y parsers activos)
app.use('/', viewsRouter);
app.use('/api/products', productsRouter);
app.use('/api/carts', cartsRouter);

// Handlebars config con helpers
app.engine("handlebars", engine({
    helpers: {
        multiply: (a, b) => a * b,
        sum: (products) => {
            let total = 0;
            products.forEach(p => {
                total += p.product.price * p.quantity;
            });
            return total;
        }
    }
}));
app.set("view engine", "handlebars");
app.set("views", "./views");

// Rutas vistas simples si las tenés
app.get('/', async (req, res) => {
    const products = await Product.find().lean();
    res.render('home', { products });
});

// Websockets (mantén tu lógica)
io.on('connection', async (socket) => {
    console.log('🔌 Cliente conectado');
    socket.emit('productos', await Product.find().lean());
    // ...
});

httpServer.listen(PORT, () => 
    console.log("🚀 Servidor escuchando en puerto " + PORT)
);
