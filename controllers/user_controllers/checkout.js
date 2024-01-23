const userCollection = require("../../models/user_schema");
const productCollection = require("../../models/product");
const cartCollection = require("../../models/cart");
const addressCollection = require("../../models/address");
const orderCollection = require("../../models/order");
const couponCollection = require("../../models/coupon");
const { subtotal } = require("./cartdetails");
const offerController = require("../admin_controllers/adm_offermanage");

const Razorpay = require("razorpay");
const walletCollection = require("../../models/wallet");
const { RAZORPAY_ID_KEY, RAZORPAY_SECRET_KEY } = process.env;

const instance = new Razorpay({
  key_id: RAZORPAY_ID_KEY,
  key_secret: RAZORPAY_SECRET_KEY,
});

// render checkout
module.exports.getCheckout = async (req, res) => {
  try {
    await offerController.deactivateExpiredOffers();
    const loggedIn = req.cookies.loggedIn;
    const userData = await userCollection.findOne({ email: req.user });
    const username = userData.username;

    const userId = userData._id;
    const cartDetails = await cartCollection
      .findOne({ userId: userId })
      .populate("products.productId");
    const addressDetails = await addressCollection.findOne({ userId: userId });

    const coupondata = await couponCollection.find();
    const coupons = coupondata.filter((coupons) => coupons.status !== "Block");

    if (!cartDetails || cartDetails.products.length === 0) {
      return res.redirect("/");
    }

    const stockCheck = cartDetails.products.every((productItem) => {
      return productItem.productId.productStock >= productItem.quantity;
    });

    const statusCheck = cartDetails.products.every((productItem) => {
      return productItem.productId.productStatus !== "Block";
    });

    if (!stockCheck || !statusCheck) {
      // Redirect to cart if productStock is insufficient
      return res.redirect("/cart");
    }

    res.render("user-checkout", {
      loggedIn,
      username,
      cartDetails,
      subtotal,
      addressDetails,
      userId,
      coupons,
    });
  } catch (error) {
    console.error(error);
  }
};

// grandtotal amount
module.exports.grandtotal = async (req, res) => {
  try {
    const userData = await userCollection.findOne({ email: req.user });
    const userId = userData._id;
    const cartDetails = await cartCollection
      .findOne({ userId: userId })
      .populate("products.productId");
    const productOffers = await productCollection.find({
      discountStatus: "Active",
    });

    let subtotal = 0;

    for (const productItem of cartDetails.products) {
      const product = await productCollection.findById(productItem.productId);
      subtotal += product.sellingPrice * productItem.quantity;

      // Check if the product has a discount offer
      const matchingOffer = productOffers.find(
        (offer) => offer.productName === product.productName
      );

      if (matchingOffer) {
        const discountedAmount =
          (productItem.quantity *
            (product.sellingPrice * matchingOffer.discountPercent)) /
          100;

        // Ensure that discountedAmount is a valid number
        if (!isNaN(discountedAmount)) {
          subtotal -= discountedAmount;
          console.log("discountedAmount is", discountedAmount);
        }
      }
    }

    res.json({ success: true, subtotal });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};




// cash on delivery
module.exports.cashOnDelivery = async (req, res) => {
  try {
    await offerController.deactivateExpiredOffers();
    const userData = await userCollection.findOne({ email: req.user });
    const userId = userData._id;
    const cartDetails = await cartCollection
      .findOne({ userId: userId })
      .populate("products.productId");

    const couponCode = req.body.couponCode;
    const addressId = req.body.selectedAddresses;
    const address = await addressCollection.findOne(
      { userId: userId, "address._id": addressId },
      { "address.$": 1 }
    );
    const productOffers = await productCollection.find({
      discountStatus: "Active",
    });

    // Check if productStock is sufficient for each product in the cart
    const stockCheck = cartDetails.products.every((productItem) => {
      return productItem.productId.productStock >= productItem.quantity;
    });

    const statusCheck = cartDetails.products.every((productItem) => {
      return productItem.productId.productStatus !== "Block";
    });

    if (!stockCheck || !statusCheck) {
      return res.redirect("/cart");
    }

    let totalAmount = 0;
    let divideAmount = 0;

    let orderProducts = await Promise.all(
      cartDetails.products.map(async (productItem) => {
        let product = await productCollection.findById(productItem.productId);
        totalAmount += product.sellingPrice * productItem.quantity;
        divideAmount += product.sellingPrice * productItem.quantity;

        return {
          productId: productItem.productId,
          price: product.sellingPrice,
          quantity: productItem.quantity,
        };
      })
    );

    if (couponCode) {
      const usedCoupon = await couponCollection.findOne({
        couponCode: couponCode,
      });

      if (usedCoupon) {
        const minAmount = usedCoupon.minimumPurchase;
        const currentDate = new Date();
        console.log("inside checking", couponCode);
        if (usedCoupon.redeemedUser.includes(userId)) {
          res
            .status(200)
            .json({
              alreadyRedeemed: true,
              message: "Coupon already redeemed by the user",
            });
        } else if (usedCoupon.minimumPurchase > totalAmount) {
          res
            .status(200)
            .json({
              minimumAmount: true,
              message:
                "Unable use coupon the order price decreased to " + totalAmount,
            });
        } else if (usedCoupon.status === "Block") {
          res.status(200).json({ blocked: true, message: "Coupon is blocked" });
        } else if (
          usedCoupon.expiryDate &&
          usedCoupon.expiryDate.getTime() < currentDate.getTime()
        ) {
          res.status(200).send({ expired: true, message: "Coupon is expired" });
        } else {
          const paymentMethod = "Cash On Delivery";

          const couponAmount = parseFloat(usedCoupon.discountAmount);
          totalAmount = Math.max(totalAmount - couponAmount, 0);
          console.log("total amount", totalAmount);

          let divideAmount = 0;
          let orderProducts = [];

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

            // Calculate the total amount of products
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
            address,
          });

          // Delete products from cart
          await cartCollection.findOneAndDelete({ userId: userId });
          // res.status(200).json({ message: "order placed" });

          usedCoupon.redeemedUser.push(userId);
          await usedCoupon.save();

          res.status(200).json({
            applied: true,
            message: "Coupon applied successfully",
            couponAmount: couponAmount,
            totalAmount: totalAmount.toFixed(2),
          });
        }
      } else {
        res.status(404).send({ message: "Coupon not found" });
      }
    } else {
      const paymentMethod = "Cash On Delivery";

      let orderProducts = await Promise.all(
        cartDetails.products.map(async (productItem) => {
          let product = await productCollection.findById(productItem.productId);
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
        totalAmount,
        payableAmount: totalAmount,
        paymentMethod,
        address,
      });

      // Delete products from cart
      await cartCollection.findOneAndDelete({ userId: userId });
      res.status(200).json({ applied: true, message: "order placed" });
    }
  } catch (error) {
    console.log("Error:", error);
    res.status(500).render("error");
  }
};














// razorpay order
module.exports.razorpayOrder = async (req, res) => {
  try {
    console.log(req.body)
    await offerController.deactivateExpiredOffers();
    const userData = await userCollection.findOne({ email: req.user });
    const userId = userData._id;
    const couponCode = req.body.couponCode;
    const addressId = req.body.selectedAddresses;
    console.log("coupon cd", couponCode);
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

    // Check if productStock is sufficient for each product in the cart
    const stockCheck = cartDetails.products.every((productItem) => {
      return productItem.productId.productStock >= productItem.quantity;
    });

    const statusCheck = cartDetails.products.every((productItem) => {
      return productItem.productId.productStatus !== "Block";
    });

    if (!stockCheck || !statusCheck) {
      return res.redirect("/cart");
    }
    // finding amount
    let totalAmount = 0;

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
      const usedCoupon = await couponCollection.findOne({
        couponCode: couponCode,
      });

      if (usedCoupon) {
        const minAmount = usedCoupon.minimumPurchase;
        const currentDate = new Date();
        console.log("inside checking", couponCode);
        if (usedCoupon.redeemedUser.includes(userId)) {
          res
            .status(200)
            .json({
              alreadyRedeemed: true,
              message: "Coupon already redeemed by the user",
            });
        } else if (usedCoupon.minimumPurchase > totalAmount) {
          res
            .status(200)
            .json({
              minimumAmount: true,
              message:
                "Unable use coupon the order price decreased to " + totalAmount,
            });
        } else if (usedCoupon.status === "Block") {
          res.status(200).json({ blocked: true, message: "Coupon is blocked" });
        } else if (
          usedCoupon.expiryDate &&
          usedCoupon.expiryDate.getTime() < currentDate.getTime()
        ) {
          res.status(200).send({ expired: true, message: "Coupon is expired" });
        } else {
          const couponAmount = parseFloat(usedCoupon.discountAmount);
          totalAmount = Math.max(totalAmount - couponAmount, 0);
          console.log("total amount", totalAmount);

          let orderProducts = await Promise.all(
            cartDetails.products.map(async (productItem) => {
              let product = await productCollection.findById(
                productItem.productId
              );
              let productTotalPrice =
                product.sellingPrice * productItem.quantity;

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

          var options = {
            amount: totalAmount * 100,
            currency: "INR",
            receipt: "order_rcptid_11",
          };

          console.log("Options:", options);

          instance.orders.create(options, function (err, order) {
            if (err) {
              console.error("Razorpay error:", err);
              return res
                .status(500)
                .json({ success: false, message: "Error creating order" });
            }
            console.log("Razorpay Order:", order);
            console.log("Total Amount:", totalAmount);
            res.status(200).json({
              success: true,
              message: "order placed",
              totalAmount: totalAmount.toFixed(2),
              addressId: addressId,
              order: order,
              orderId: order.id,
              couponCode: couponCode,
            });
          });
        }
      } else {
        res.status(404).send({ message: "Coupon not found" });
      }
    } else {
      let orderProducts = await Promise.all(
        cartDetails.products.map(async (productItem) => {
          let product = await productCollection.findById(productItem.productId);
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

      var options = {
        amount: totalAmount * 100,
        currency: "INR",
        receipt: "order_rcptid_11",
      };
      instance.orders.create(options, function (err, order) {
        console.log("orders: ", order);
        console.log("total amount ", totalAmount);
        res.status(200).json({
          success: true,
          message: "order placed",
          totalAmount: totalAmount.toFixed(2),
          addressId: addressId,
          order: order,
          orderId: order.id,
        });
      });
    }
  } catch (error) {
    console.log("Error:", error);
    res.status(500).render("error");
  }
};




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




// wallet pay
module.exports.walletPay = async (req, res) => {
  try {
    console.log(req.body)
    await offerController.deactivateExpiredOffers();
    const userData = await userCollection.findOne({ email: req.user });


    const userId = userData._id;
    console.log("userid", userId);
    const cartDetails = await cartCollection
      .findOne({ userId: userId })
      .populate("products.productId");
    const walletData = await walletCollection.findOne({ userId: userId });
    
    console.log("walletdata: ", walletData);
    const walletAmout = walletData.amount;


   
  //   const cartDetails = await cartCollection
  //   .findOne({ userId: user._id })
  //   .populate("products.productId");

  // const walletData = await walletCollection.findOne({ userId: user._id });
  
  // console.log("walletdata: ", walletData);
  // const walletAmout = walletData.amount;


    const couponCode = req.body.couponCode;
    const addressId = req.body.selectedAddresses;
    const address = await addressCollection.findOne(
      { userId: userId, "address._id": addressId },
      { "address.$": 1 }
    );

    const productOffers = await productCollection.find({
      discountStatus: "Active",
    });

    console.log(couponCode, addressId);

    // Check if productStock is sufficient for each product in the cart
    const stockCheck = cartDetails.products.every((productItem) => {
      return productItem.productId.productStock >= productItem.quantity;
    });

    const statusCheck = cartDetails.products.every((productItem) => {
      return productItem.productId.productStatus !== "Block";
    });

    if (!stockCheck || !statusCheck) {
      return res.redirect("/cart");
    }

    let totalAmount = 0;
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
      const usedCoupon = await couponCollection.findOne({
        couponCode: couponCode,
      });

      if (usedCoupon) {
        const minAmount = usedCoupon.minimumPurchase;
        const currentDate = new Date();
        console.log("inside checking", couponCode);
        if (usedCoupon.redeemedUser.includes(userId)) {
          res
            .status(200)
            .json({
              alreadyRedeemed: true,
              message: "Coupon already redeemed by the user",
            });
        } else if (usedCoupon.minimumPurchase > totalAmount) {
          res
            .status(200)
            .json({
              minimumAmount: true,
              message:
                "Unable use coupon the order price decreased to " + totalAmount,
            });
        } else if (usedCoupon.status === "Block") {
          res.status(200).json({ blocked: true, message: "Coupon is blocked" });
        } else if (
          usedCoupon.expiryDate &&
          usedCoupon.expiryDate.getTime() < currentDate.getTime()
        ) {
          res.status(200).send({ expired: true, message: "Coupon is expired" });
        } else {
          const couponAmount = parseFloat(usedCoupon.discountAmount);
          totalAmount = Math.max(totalAmount - couponAmount, 0);
          console.log("total amount", totalAmount);

          let orderProducts = await Promise.all(
            cartDetails.products.map(async (productItem) => {
              let product = await productCollection.findById(
                productItem.productId
              );
              let productTotalPrice =
                product.sellingPrice * productItem.quantity;

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

          if (totalAmount <= walletAmout) {
            let divideAmount = 0;
            let orderProducts = [];

            for (const productItem of cartDetails.products) {
              const product = await productCollection.findById(
                productItem.productId
              );
              let productTotalPrice =
                product.sellingPrice * productItem.quantity;

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
                  console.log("discountedAmount is", discountedAmount);
                }
              }

              // Update productStock
              product.productStock -= productItem.quantity;
              await product.save();

              // Calculate the total amount of products
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

            const paymentMethod = "Wallet";
            const paymentStatus = "Success";

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
            // res.status(200).json({ message: "order placed" });

            usedCoupon.redeemedUser.push(userId);
            await usedCoupon.save();

            // Subtract totalAmount from the walletAmount
            await walletCollection.findOneAndUpdate(
              { userId },
              { $inc: { amount: -totalAmount } }
            );

            res.status(200).json({
              applied: true,
              message: "Coupon applied successfully",
              couponAmount: couponAmount,
              totalAmount: totalAmount.toFixed(2),
            });
          } else {
            res
              .status(200)
              .json({
                excessAmount: true,
                message: "you have only " + walletAmout + " in your wallet",
              });
          }
        }
      } else {
        res.status(404).send({ message: "Coupon not found" });
      }
    } else {
      let orderProducts = await Promise.all(
        cartDetails.products.map(async (productItem) => {
          let product = await productCollection.findById(productItem.productId);
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

      if (totalAmount <= walletAmout) {
        let orderProducts = await Promise.all(
          cartDetails.products.map(async (productItem) => {
            let product = await productCollection.findById(
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

        const paymentMethod = "Wallet";
        const paymentStatus = "Success";

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

        // Subtract totalAmount from the walletAmount
        await walletCollection.findOneAndUpdate(
          { userId },
          { $inc: { amount: -totalAmount.toFixed(2) } }
        );

        res.status(200).json({ applied: true, message: "order placed" });
      } else {
        res
          .status(200)
          .json({
            excessAmount: true,
            message: "you have only " + walletAmout + " in your wallet",
          });
      }
    }
  } catch (error) {
    console.error("error: ", error);
  }
};






// render place order page
module.exports.getPlaceOrder = async (req, res) => {
  try {
    const loggedIn = req.cookies.loggedIn;
    const userData = await userCollection.findOne({ email: req.user });
    const userId = userData._id;
    const username = userData.username;

    res.render("user-orderplaced", { loggedIn, username });
  } catch (error) {
    console.error("error: ", error);
  }
};






// apply coupon
module.exports.applyCoupon = async (req, res) => {
  try {
    await offerController.deactivateExpiredOffers();
    const couponCode = req.body.couponCode;
    const totalAmount = req.body.subtotalData;

    const userData = await userCollection.findOne({ email: req.user });
    const userId = userData._id;
    const usedCoupon = await couponCollection.findOne({
      couponCode: couponCode,
    });
    const minAmount = usedCoupon.minimumPurchase;
    const currentDate = new Date();

    console.log(totalAmount, usedCoupon.discountAmount);

    if (usedCoupon) {
      if (usedCoupon.redeemedUser.includes(userId)) {
        res
          .status(200)
          .json({
            alreadyRedeemed: true,
            message: "Coupon already redeemed by the user",
          });
      } else if (usedCoupon.minimumPurchase > totalAmount) {
        res
          .status(200)
          .json({
            minimumAmount: true,
            message: "Minimum Purchase Amount " + minAmount + " required",
          });
      } else if (usedCoupon.status === "Block") {
        res.status(200).json({ blocked: true, message: "coupon is blocked" });
      } else if (
        usedCoupon.expiryDate &&
        usedCoupon.expiryDate.getTime() < currentDate.getTime()
      ) {
        res.status(200).send({ expired: true, message: "coupon is expired" });
      } else {
        // usedCoupon.redeemedUser.push(userId)
        // await usedCoupon.save();

        const couponAmount = parseFloat(usedCoupon.discountAmount);
        const updatedTotal = Math.max(totalAmount - couponAmount);
        console.log(updatedTotal);

        res.status(200).json({
          applied: true,
          message: "Coupon applied successfully",
          couponAmount: couponAmount,
          updatedTotal: updatedTotal.toFixed(2),
          couponCode,
        });
      }
    } else {
      res.status(404).send({ message: "Coupon not found" });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send({ error: "Internal Server Error" });
  }
};
// remove coupon
module.exports.removeCoupon = async (req, res) => {
  try {
    const couponCode = req.body.couponCode;
    const userData = await userCollection.findOne({ email: req.user });
    const userId = userData._id;
    const usedCoupon = await couponCollection.findOne({
      couponCode: couponCode,
    });

    if (usedCoupon) {
      const removecoupon = await couponCollection.updateOne(
        { couponCode: couponCode },
        { $pull: { redeemedUser: userId } }
      );
    }
    // res.redirect("/checkout");
    res.status(200).json({ message: "coupon removed succussfully" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send({ error: "Internal Server Error" });
  }
};
