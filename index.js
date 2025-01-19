const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

// Import SHA512Module correctly
const SHA512 = require('./public/js/SHA512');

// const SHA512 = require('./public/js/SHA512');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const stripe = require("stripe")(process.env.STRIPE_PRIVATE_KEY);

// Mock coupons data (for example purposes)
const coupons = {
  'SUMMER2024': 5,  // 10% discount
  'WINTER2024': 3,  // 15% discount
  'DISCOUNT20': 8,
  'SAVE10': 9
  // Add more coupons as needed
};

// API endpoint to validate coupon code
app.post("/validate-coupon", (req, res) => {
  const { couponCode } = req.body;

  if (!couponCode) {
    return res.status(400).json({ error: "No coupon code provided" });
  }

  // Check if the coupon code is valid
  const discount = coupons[couponCode];

  if (discount !== undefined) {
    // If coupon is valid, return discount
    return res.json({ valid: true, discount });
  } else {
    // If coupon is invalid, return not valid
    return res.json({ valid: false, discount: 0 });
  }
});

function verifyPrice(price, hashedPrice) {
  const expectedHash = SHA512.encryptor(price.toString());
  return expectedHash === hashedPrice;
}

app.post("/process-discount", (req, res) => {
  try {
    const { product, price, attackProtection, hashedPrice } = req.body;
    console.log("Request payload:", req.body);
    
    let processedPrice;
    
    if (attackProtection) {
        // When protected, return the original price for Stripe
        processedPrice = verifyPrice(hashedPrice);
    } else {
        // For unprotected mode, use the numerical price
        processedPrice = parseFloat(price);
    }

    console.log("Processed price:", processedPrice);
    res.json({ processedPrice });
    
} catch (error) {
    console.error("Process discount error:", error);
    res.status(500).json({ error: error.message });
}
});

app.post("/create-checkout-session", async (req, res) => {
  try {
    const { product, processedPrice } = req.body;

    const priceInPaise = Math.round(processedPrice * 100);
    
    if (!product) {
        return res.status(400).json({ error: "No product provided" });
    }

    // const priceInPaise = Math.round(price * 100);

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        line_items: [{
            price_data: {
                currency: "inr",
                product_data: {
                    name: product.title,
                    description: `Rating: ${product.rating}`,
                    images: [product.images[0]],
                },
                unit_amount: priceInPaise,
            },
            quantity: 1,
        }],
        success_url: `${process.env.SERVER_URL}/success.html`,
        cancel_url: `${process.env.SERVER_URL}/cancel.html`,
    });

    return res.json({ url: session.url });
  } catch (e) {
    console.error("Error creating checkout session:", e);
    return res.status(500).json({ error: e.message });
  }
});

app.get('/intermediate-checkout.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'intermediate-checkout.html'));
});


app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});