async function initiateCheckout(product) {
    const couponInputId = `couponCode-${product.id}`;
    const couponCode = document.getElementById(couponInputId).value;
    const isProtected = document.getElementById("attackProtection").checked;
    const basePrice = product.price * 82;

    // Store complete product details
    const productDetails = {
        id: product.id,
        title: product.title,
        price: basePrice,
        rating: product.rating,
        images: product.images
    };

    localStorage.setItem('attackProtection', isProtected);
    localStorage.setItem('currentProduct', JSON.stringify(productDetails));

    window.location.href = `/intermediate-checkout.html?price=${basePrice}&coupon=${couponCode}`;

    // const attackProtection = document.getElementById("attackProtection").checked;
    //  if (attackProtection) {
    //     product.hash = SHA512(product.price.toString());
    // }
    //
    // // Access the coupon code input field
    // const couponField = document.querySelector("input[id='couponCode']"); // Get the coupon code input field
    // const couponCode = couponField ? couponField.value : ""; // Get the value or an empty string if not found
    //
    // let discount = 0;
    // if (couponCode) {
    //     discount = await validateCoupon(couponCode);  // Validate the coupon and get the discount
    // }
    //
    // // Calculate the price in paise, assuming product.price is in INR
    // const originalPriceInPaise = Math.round(product.price * 100); // Convert to paise (1 INR = 100 paise)
    // const discountedPriceInPaise = Math.round(originalPriceInPaise * (1 - discount / 100)); // Apply discount
    //
    // // Log the values to debug
    // console.log('Original Price in Paise:', originalPriceInPaise); // Log original price in paise
    // console.log('Discount:', discount);
    // console.log('Discounted Price in Paise:', discountedPriceInPaise); // Log discounted price in paise
    //
    // setTimeout(() => {
    //     fetch("/create-checkout-session", {
    //         method: "POST",
    //         headers: {
    //             "Content-Type": "application/json",
    //         },
    //         body: JSON.stringify({
    //             product: {
    //                 title: product.title,
    //                 rating: product.rating,
    //                 images: product.images,
    //                 hash: product.hash, // Include hash if attack protection is enabled
    //             },
    //             price: discountedPriceInPaise, // Send the discounted price separately
    //             attackProtection
    //         })
    //     })
    //     .then((res) => {
    //         if (res.ok) return res.json();
    //         return res.json().then((json) => Promise.reject(json));
    //     })
    //     .then(({ url }) => {
    //         window.location = url;
    //     })
    //     .catch((e) => {
    //         console.error(e.error);
    //         alert("An error occurred during checkout. Please try again.");
    //     });
    // }, 2000); // 2 second delay
}

// document.addEventListener('DOMContentLoaded', () => {
//     const buyButtons = document.querySelectorAll('.buy-button');
//     buyButtons.forEach(button => {
//         button.addEventListener('click', (event) => {
//             const product = JSON.parse(event.target.dataset.product);
//             initiateCheckout(product);
//         });
//     });
// });
// Function to validate the coupon code by making an API call
function validateCoupon(couponCode) {
    return fetch("/validate-coupon", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ couponCode }),  // Send the coupon code for validation
    })
    .then(res => res.json())
    .then(data => {
        if (data.valid) {
            return data.discount;  // Return the discount percentage if the coupon is valid
        } else {
            alert("Invalid coupon code");  // Notify the user if the coupon is invalid
            return 0;  // Return 0% discount if invalid
        }
    })
    .catch(err => {
        console.error("Error validating coupon", err);
        alert("An error occurred while validating the coupon. Please try again.");
        return 0;  // Return 0% discount in case of an error
    });
}

function toggleAttackProtection() {
    const isEnabled = document.getElementById("attackProtection").checked;
    localStorage.setItem('attackProtection', 'true');
    console.log("Attack protection enabled:", isEnabled);
}