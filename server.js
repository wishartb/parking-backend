require('dotenv').config();
const express = require('express');
const Stripe = require('stripe');
const cors = require('cors'); // No 'qrcode' needed anymore

const app = express();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

app.use(cors());
app.use(express.json());

const RATES = { hourly: 500, daily: 2000, monthly: 15000 };

app.post('/create-checkout-session', async (req, res) => {
    try {
        const { plate, pricingType, duration } = req.body;

        if (!RATES[pricingType]) return res.status(400).json({ error: "Invalid rate" });
        const totalAmount = RATES[pricingType] * duration;

        // Create Stripe Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'], // Apple/Google pay work great on mobile
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: `Parking: ${pricingType.toUpperCase()}`,
                        description: `Plate: ${plate}`,
                    },
                    unit_amount: totalAmount,
                },
                quantity: 1,
            }],
            mode: 'payment',
            // success_url: Where they go AFTER paying
            success_url: 'https://your-site.com/success.html',
            cancel_url: 'https://your-site.com/cancel.html',
            metadata: { license_plate: plate, duration: duration }
        });

        // Send the URL directly to the frontend
        res.json({ url: session.url });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(3000, () => console.log('Backend running on port 3000'));
