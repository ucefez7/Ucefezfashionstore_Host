module.exports.errorHandler = (error,req,res,next)=>{
    console.log(error);
    res.render("page-404");
}
module.exports.errorHandler2 = (req,res)=>{
    res.render("page-404");
}