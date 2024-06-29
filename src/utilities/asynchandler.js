const asynchandler=(requesthandler)=>{
    return (req,res,next)=>{
        Promise.resolve(requesthandler(req,res,next)).
        catch((err)=>next(err))
    }
}

export { asynchandler }

// const asynchandler=(func)=>async (req,res,next)=>{
//     try {
//         await func(req,res,next)
//     } catch (error) {
//         res.status(error.code|| 500).json({
//                   success:false,
//                   message:error.message
//         })
//     }
// }