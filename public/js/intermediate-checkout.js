// intermediate-checkout.js
let product = null;
let discountedPrice = 0;

window.onload = function() {
    // Get stored protection status and product
    const isProtected = localStorage.getItem('attackProtection') === 'true';
    product = JSON.parse(localStorage.getItem('currentProduct'));
    
    const urlParams = new URLSearchParams(window.location.search);
    const basePrice = parseFloat(urlParams.get('price'));
    const couponCode = urlParams.get('coupon');
    
    discountedPrice = applyCoupon(basePrice, couponCode);

    // Create and display product details
    const productDetailsDiv = document.createElement('div');
    productDetailsDiv.id = 'product-details';
    document.body.appendChild(productDetailsDiv);
    displayProductDetails(productDetailsDiv);

    // // Display checkout info
    // displayCheckoutInfo(discountedPrice);
}

function applyCoupon(basePrice, couponCode) {
    // Coupon logic
    if (couponCode === 'DISCOUNT20') {
        return basePrice * 0.8; // 20% discount
    } else if (couponCode === 'SAVE10') {
        return basePrice * 0.9; // 10% discount
    }
    return basePrice; // No discount if invalid coupon
}

// const { SHA512 } = require('./SHA512');
// function displayCheckoutInfo(finalPrice) {
//     const checkoutInfo = document.getElementById('checkout-info');
//     const currentProduct = JSON.parse(localStorage.getItem('currentProduct'));

//     if (checkoutInfo && currentProduct) {
//         checkoutInfo.innerHTML = `
//             <div class="checkout-summary">
//                 <h3>${currentProduct.title}</h3>
//                 <img src="${currentProduct.images[0]}" alt="${currentProduct.title}" style="max-width: 200px;">
//                 <p>Rating: ${currentProduct.rating}</p>
//                 <p>Final Price: ₹${finalPrice.toFixed(2)}</p>
//             </div>
//         `;
//     }
// }

document.addEventListener('DOMContentLoaded', () => {
    // Retrieve product details from localStorage
    product = JSON.parse(localStorage.getItem('checkoutProduct'));
    if (!product) {
        window.location.href = '/'; // Redirect to home if no product
        return;
    }
    const detailsDiv = document.getElementById('product-details');
    const checkoutForm = document.getElementById('checkout-form');

    if (detailsDiv && checkoutForm) {
        displayProductDetails(detailsDiv);
        checkoutForm.addEventListener('submit', handleCheckout);
    } else {
        console.error('Required DOM elements not found');
    }

});

function displayProductDetails(detailsDiv) {
    const currentProduct = JSON.parse(localStorage.getItem('currentProduct'));
    console.log("displayProduct function is loaded");

    detailsDiv.innerHTML = `
        <h2>${currentProduct.title}</h2>
        <p>Price: ₹${currentProduct.price}</p>
        <p>Rating: ${currentProduct.rating}</p>
        <img src="${currentProduct.images[0]}" alt="${currentProduct.title}" style="max-width: 200px;">
    `;
}
console.log("DOM Content Loaded");
console.log("Product from localStorage:", product);
console.log("Details Div:", document.getElementById('product-details'));
console.log("Checkout Form:", document.getElementById('checkout-form'));
async function handleCheckout(event) {
    event.preventDefault();
    const couponCode = document.getElementById('couponCode').value;

    try {
        const response = await fetch('/validate-coupon', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ couponCode })
        });
        const data = await response.json();

        if (data.valid) {
            const discount = data.discount;
            discountedPrice = product.price * (1 - discount / 100);
            alert(`Coupon applied! New price: ₹${discountedPrice.toFixed(2)}`);
        } else {
            alert('Invalid coupon code');
            discountedPrice = product.price;
        }

        // Instead of directly initiating Stripe checkout, send the discounted price to a new endpoint
        sendDiscountedPrice();
    } catch (error) {
        console.error('Error applying coupon:', error);
        alert('An error occurred. Please try again.');
    }
}

function hashPrice(price) {
    const priceStr = price.toString();
    return SHA512Module.encryptor(priceStr);
}

function sendDiscountedPrice() {
    console.log("Sending discounted price");
    const priceInPaise = Math.round(discountedPrice * 100);
    console.log("Price in paise:", priceInPaise);
    const priceInRupees = discountedPrice;

    const isProtected = localStorage.getItem('attackProtection') === 'true';
    const priceToHash = discountedPrice.toString();

    let payload;
    if (isProtected) {
        // Only send hashed price when protected
        payload = {
            product: {
                title: product.title,
                rating: product.rating,
                images: product.images
            },
            hashedPrice: SHA512.encryptor(priceToHash),
            attackProtection: true
        };
    } else {
        // Send full details when unprotected
        payload = {
            product: {
                title: product.title,
                rating: product.rating,
                images: product.images
            },
            price: discountedPrice,
            attackProtection: false
        };
    }

    console.log("Sending payload:", payload); // Console logging for local debugging


    // if (isProtected) {
    //     payload.price = SHA512.encryptor(priceInRupees.toString());
    //     payload.originalPrice = priceInRupees;
    // } else {
    //     payload.price = priceInRupees;
    // }

    console.log("Sending request to /process-discount");
    fetch('http://localhost:3000/process-discount', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(data => {
        console.log("Received response from /process-discount");
        console.log("Processed price:", data.processedPrice);
        // Pass the original price for Stripe checkout
        console.log("Server Response:", data);
        initiateStripeCheckout(data.processedPrice || discountedPrice);
    })
    .catch(error => {
        console.error("Error:", error);
        alert("An error occurred during checkout. Please try again.");
    });
}

function initiateStripeCheckout(finalPrice) {
    const payload = {
        product: {
            title: product.title,
            rating: product.rating,
            images: product.images,
        },
        processedPrice: finalPrice
    };

    // const priceInPaise = Math.round(processedPrice * 100);
    // const hashedPriceForCheckout = SHA512Module.encryptor(processedPrice.toString());

    fetch('/create-checkout-session', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(data => {
        if (data.url) {
            window.location = data.url;
        } else {
            throw new Error(data.error || 'Checkout creation failed');
        }
    })
    .catch(error => {
        console.error("Error:", error);
        alert("An error occurred during checkout. Please try again.");
    });
}