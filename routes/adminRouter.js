const express = require("express");
const adminRouter = express.Router();
const multer = require("multer");
const cookieparser = require("cookie-parser");
const jwt = require("jsonwebtoken");
adminRouter.use(cookieparser());
adminRouter.use(express.json());

const uploads = require("../middlewares/multer_middleware")
const adminMiddleware = require("../middlewares/admin_authentication")
const loginControll = require("../controllers/admin_controllers/adm_login")
const dashboardControll = require("../controllers/admin_controllers/adm_dashboard")
const categoryControll = require("../controllers/admin_controllers/adm_category")
const productControll = require("../controllers/admin_controllers/adm_product")
const usermanageControll = require("../controllers/admin_controllers/adm_usermanage")
const ordermanageControll = require("../controllers/admin_controllers/adm_ordermanage")
const cropImage = require("../controllers/admin_controllers/adm_cropimage")
const salesReport = require("../controllers/admin_controllers/adm_salesreport");
const adminDashboard = require("../controllers/admin_controllers/adm_dashboard");

const couponmanageControll = require("../controllers/admin_controllers/adm_couponmanage")
const offermanageControll = require("../controllers/admin_controllers/adm_offermanage")



adminRouter.use("/public/uploads",express.static('public/uploads'));
adminRouter.use("/uploads",express.static('uploads'));


// login
adminRouter.get("/", loginControll.getAdminLogin)
adminRouter.post("/adminpost-login", loginControll.adminPostLogin)

// adminRouter.get("/admin-dash",adminMiddleware.verifyadmin, loginControll.getAdminDashboard)
adminRouter.get("/admin-dash",adminMiddleware.verifyadmin, adminDashboard.getAdminDashboard)
adminRouter.get("/admin-logout", loginControll.getLogout)

// homepage
// adminRouter.get("/admin-dash", dashboardControll.getAdminDashboard)
// adminRouter.get("/admin-logout", dashboardControll.getLogout)

// Category
adminRouter.get("/category-list", adminMiddleware.verifyadmin, categoryControll.getCategory)
adminRouter.post("/add-category", adminMiddleware.verifyadmin, categoryControll.postCategory)
adminRouter.get("/edit-category/:categoryId", adminMiddleware.verifyadmin, categoryControll.editCategory)
adminRouter.post("/postEdit-category/:categoryId", adminMiddleware.verifyadmin, categoryControll.updateCategory)
// adminRouter.get("/delete-category/:categoryId", adminMiddleware.verifyadmin, categoryControll.deleteCategory)
adminRouter.get("/block-category/:categoryId", adminMiddleware.verifyadmin, categoryControll.blockCategory)
adminRouter.get("/unblock-category/:categoryId", adminMiddleware.verifyadmin, categoryControll.unblockCategory)

// Product
adminRouter.get("/product-list", adminMiddleware.verifyadmin, productControll.getProductList)
adminRouter.get("/add-product", adminMiddleware.verifyadmin, productControll.getAddProduct)
adminRouter.post("/postadd-product", uploads.array("productImg"), adminMiddleware.verifyadmin, productControll.postProduct)
adminRouter.get("/delete-product/:productId", adminMiddleware.verifyadmin, productControll.deleteProduct);
adminRouter.get("/edit-product/:productId",adminMiddleware.verifyadmin, productControll.editProduct)
adminRouter.post("/postEdit-product/:productId", uploads.array("productImg"), adminMiddleware.verifyadmin, productControll.updateProduct)
adminRouter.get("/block-product/:productId", adminMiddleware.verifyadmin, productControll.blockProduct)
adminRouter.get("/unblock-product/:productId", adminMiddleware.verifyadmin, productControll.unblockProduct)
adminRouter.get("/delete-image", adminMiddleware.verifyadmin, productControll.deleteImage)

//crop images
adminRouter.get("/crop/:productId", adminMiddleware.verifyadmin, cropImage.cropimage);
adminRouter.post("/croppedimage",adminMiddleware.verifyadmin, cropImage.PostCrop);

// Manage User
adminRouter.get("/user-manage",adminMiddleware.verifyadmin, usermanageControll.getUsers)
adminRouter.get("/block-user/:userId", adminMiddleware.verifyadmin, usermanageControll.blockUser)
adminRouter.get("/unblock-user/:userId", adminMiddleware.verifyadmin, usermanageControll.unblockUser)

// manage order
adminRouter.get("/order-list", adminMiddleware.verifyadmin, ordermanageControll.getOrderlist)
adminRouter.get("/order-manage/:orderId", adminMiddleware.verifyadmin, ordermanageControll.getOrdermanage)
adminRouter.post("/dispatch-order", adminMiddleware.verifyadmin, ordermanageControll.dispatchOrder)
adminRouter.post("/deliver-order", adminMiddleware.verifyadmin, ordermanageControll.deliverOrder)
adminRouter.post("/cancel-order", adminMiddleware.verifyadmin, ordermanageControll.cancelOrder)




// salesReport
adminRouter.get("/sales-report", adminMiddleware.verifyadmin, salesReport.salesReport);
adminRouter.post("/filter-sales",adminMiddleware.verifyadmin, salesReport.filterSales )

// manage coupon
adminRouter.get("/coupon-list", adminMiddleware.verifyadmin, couponmanageControll.getCouponlist)
adminRouter.get("/add-coupon", adminMiddleware.verifyadmin, couponmanageControll.addCoupon)
adminRouter.post("/post-coupon", adminMiddleware.verifyadmin, couponmanageControll.postCoupon)
adminRouter.get("/edit-coupon/:couponId", adminMiddleware.verifyadmin, couponmanageControll.editCoupon)
adminRouter.post("/postEdit-coupon", adminMiddleware.verifyadmin, couponmanageControll.postEditcoupon)
adminRouter.get("/block-coupon/:couponId", adminMiddleware.verifyadmin, couponmanageControll.blockCoupon)
adminRouter.get("/unblock-coupon/:couponId", adminMiddleware.verifyadmin, couponmanageControll.unblockCoupon)

// manage offer
adminRouter.get("/offer-list", adminMiddleware.verifyadmin, offermanageControll.getOfferlist)
adminRouter.get("/add-offer", adminMiddleware.verifyadmin, offermanageControll.addOffer)
adminRouter.post("/postadd-offer", adminMiddleware.verifyadmin, offermanageControll.postOffer)
adminRouter.get("/edit-offer/:offerId", adminMiddleware.verifyadmin, offermanageControll.editOffer)
adminRouter.post("/postEdit-offer", adminMiddleware.verifyadmin, offermanageControll.postEditOffer)
adminRouter.get("/block-offer/:offerId", adminMiddleware.verifyadmin, offermanageControll.blockOffer)
adminRouter.get("/Unblock-offer/:offerId", adminMiddleware.verifyadmin, offermanageControll.unblockOffer)





module.exports=adminRouter;