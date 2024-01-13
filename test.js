module.exports.razorpayOrderPlaced = async (req, res) => {
  try {
    await offerController.deactivateExpiredOffers();
    const loggedIn = req.cookies.loggedIn;
    const userData = await userCollection.findOne({ email: req.user });
    const userId = userData._id;
    const username = userData.username;
    let totalAmount = 0;
    const addressId = req.query.addressId;
    const couponCode = req.query.couponCode;
    console.log("couponCode in success", couponCode);
    const address = await addressCollection.findOne(
      { userId: userId, "address._id": addressId },
      { "address.$": 1 }
    );
    const cartDetails = await cartCollection
      .findOne({ userId: userId })
      .populate("products.productId");
    const productOffers = await productCollection.find({
      discountStatus: "Active",
    });

    let orderProducts = await Promise.all(
      cartDetails.products.map(async (productItem) => {
        let product = await productCollection.findById(productItem.productId);
        totalAmount += product.sellingPrice * productItem.quantity;

        return {
          productId: productItem.productId,
          price: product.sellingPrice,
          quantity: productItem.quantity,
        };
      })
    );

    if (couponCode) {
      console.log("here");
      const usedCoupon = await couponCollection.findOne({
        couponCode: couponCode,
      });
      if (usedCoupon) {
        console.log("inside here");

        const paymentMethod = "Online payment";
        const paymentStatus = "Success";

        const couponAmount = parseFloat(usedCoupon.discountAmount);
        console.log("couponAmount", couponAmount);
        totalAmount = Math.max(totalAmount - couponAmount, 0);
        console.log("total amount minus couponamont", totalAmount);

        let divideAmount = 0;
        let orderProducts = [];

        // Calculate the total amount of products
        for (const productItem of cartDetails.products) {
          const product = await productCollection.findById(
            productItem.productId
          );
          let productTotalPrice = product.sellingPrice * productItem.quantity;

          // Check if the product has a discount offer
          const matchingOffer = productOffers.find(
            (offer) => offer.productName === product.productName
          );

          if (matchingOffer) {
            const discountedAmount =
              (productItem.quantity *
                (product.sellingPrice * matchingOffer.discountPercent)) /
              100;

            // Ensure that both product.sellingPrice and matchingOffer.discountPercent are valid numbers
            if (
              !isNaN(product.sellingPrice) &&
              !isNaN(matchingOffer.discountPercent) &&
              !isNaN(discountedAmount)
            ) {
              productTotalPrice -= discountedAmount;
              totalAmount -= discountedAmount;
              console.log("discountedAmount is", discountedAmount);
            }
          }

          // Update productStock
          product.productStock -= productItem.quantity;
          await product.save();

          divideAmount += product.sellingPrice * productItem.quantity;

          orderProducts.push({
            productId: productItem.productId,
            price: product.sellingPrice,
            quantity: productItem.quantity,
            orderPrice: isNaN(productTotalPrice)
              ? "0.00"
              : productTotalPrice.toFixed(2),
          });
        }

        // Calculate the split coupon amount for each product
        const splitedCouponAmount = couponAmount / divideAmount;

        // Apply the split coupon amount to each product
        orderProducts = orderProducts.map((product) => {
          const splitedDiscount =
            splitedCouponAmount * product.price * product.quantity;
          product.orderPrice = (
            parseFloat(product.orderPrice) - splitedDiscount
          ).toFixed(2);
          return product;
        });

        // Create the order with the adjusted totalAmount
        const userOrder = await orderCollection.create({
          userId,
          products: orderProducts,
          orderDate: new Date(),
          totalAmount,
          payableAmount: totalAmount,
          paymentMethod,
          paymentStatus,
          address,
        });

        // Delete products from cart
        await cartCollection.findOneAndDelete({ userId: userId });

        usedCoupon.redeemedUser.push(userId);
        await usedCoupon.save();

        return res.render("user-orderplaced", { loggedIn, username });
      }
    } else {
      console.log("paying without coupon");

      const paymentMethod = "Online payment";
      const paymentStatus = "Success";
      totalAmount = 0;

      let orderProducts = await Promise.all(
        cartDetails.products.map(async (productItem) => {
          let product = await productCollection.findById(productItem.productId);
          let productTotalPrice = product.sellingPrice * productItem.quantity;
          totalAmount += product.sellingPrice * productItem.quantity;

          // Check if the product has a discount offer
          const matchingOffer = productOffers.find(
            (offer) => offer.productName === product.productName
          );

          if (matchingOffer) {
            const discountedAmount =
              (productItem.quantity *
                (product.sellingPrice * matchingOffer.discountPercent)) /
              100;

            // Ensure that both product.sellingPrice and matchingOffer.discountPercent are valid numbers
            if (
              !isNaN(product.sellingPrice) &&
              !isNaN(matchingOffer.discountPercent) &&
              !isNaN(discountedAmount)
            ) {
              totalAmount -= discountedAmount
              productTotalPrice -= discountedAmount;
              console.log("discountedAmount is", discountedAmount);
            }
          }

          // Update productStock
          product.productStock -= productItem.quantity;
          await product.save();

          return {
            productId: productItem.productId,
            price: product.sellingPrice,
            quantity: productItem.quantity,
            orderPrice: isNaN(productTotalPrice)
              ? "0.00"
              : productTotalPrice.toFixed(2),
          };
        })
      );

      const userOrder = await orderCollection.create({
        userId,
        products: orderProducts,
        orderDate: new Date(),
        totalAmount: totalAmount.toFixed(2),
        payableAmount: totalAmount,
        paymentMethod,
        paymentStatus,
        address,
      });

      // Delete products from cart
      await cartCollection.findOneAndDelete({ userId: userId });

      return res.render("user-orderplaced", { loggedIn, username });
    }
  } catch (error) {
    console.log("Error:", error);
    return res.status(500).render("error");
  }
};
