export const isAdmin = async (req,res,next)=>{
    let isLoggedIn = req.session.isLoggedIn
    let isLoggedUser = req.session.isLoggeduser
        if(isLoggedIn && isLoggedUser.id_type_utilisateur ==2){
            return next();
        }else{
            return res.redirect('/');
        }
  
}

export const isAuthinticate = async (req,res,next)=>{
    let is_log_id = req.session.isLoggedIn;
   if(is_log_id){
       return next()
   }else{
    return res.redirect('/');
   }
}

export const isUnAuthinticate = (req,res,next)=>{
    if(req.session.isLoggedIn){
        return res.redirect('/');
    }
    return next()
    
}
