import mongoose from "mongoose";

const cartSchema = new mongoose.Schema({
    products: [
        {
            product: { type: mongoose.Schema.Types.ObjectId, ref: "Perfumes" },
            quantity: { type: Number, default: 1 }
        }
    ]
});

export default mongoose.model("Cart", cartSchema);
