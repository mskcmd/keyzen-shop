const User = require("../models/userModel");
const productdata = require("../models/productModel");
const bcrypt = require("bcrypt");
const multer = require("../midileware/mullter");
const Sharp = require("sharp");
const Cate = require("../models/category");
const Address = require("../models/address");

const editProfile = async (req, res) => {
    try {
        console.log(("fghjkl"));
      const update = await User.updateOne({_id: req.session.user_id},
        {$set:{
        name: req.body.name,
        email: req.body.email,
        number: req.body.number
      }})
      console.log(update);
      if(update){
        res.json({success: true})
      }
    } catch (error) {
      console.log(error.message);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

const addaddres = async(req,res)=>{
    try {
        const userData = await User.findById(req.session.user_id);
        if (userData) {
            res.render("addAddress", { user: userData });
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: "Internal server error" }); 
    }
}

const addaddres2 = async(req,res)=>{
    try {
        const userData = await User.findById(req.session.user_id);
        if (userData) {
            res.render("addAddress2", { user: userData });
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: "Internal server error" }); 
    }
}


 const addresAdd =async(req,res)=>{
try {
    const user_id=req.session.user_id
    const already = await Address.findOne({ name: req.body.name });
    if (already) {
      res.redirect("/addaddres");
    } else {
    const address = new Address ({
                user:user_id,
              name: req.body.name,
              mobile: req.body.mobile,
              email: req.body.email,
              houseName: req.body.houseName,
              city: req.body.city,
              state: req.body.state,
              pin: req.body.pin,
      });
      let result = await address.save();
      console.log(result);
      res.redirect("/landchekout");
    }
} catch (error) {
    console.log(error.message);
    res.status(500).json({ error: "Internal server error" }); 
}
 }


 const addresAdd1= async (req, res) => {
    try {

        console.log("colled");
        const user_id = req.session.user_id;
        console.log(user_id);
        const userid = req.body.id;
        if(user_id){
        
            const address = new Address({
                user: user_id,
                name: req.body.name,
                mobile: req.body.mobile,
                email: req.body.email,
                houseName: req.body.houseName,
                city: req.body.city,
                state: req.body.state,
                pin: req.body.pin,
            });

            // Save the new address
            let result = await address.save();
            console.log(result);
            res.json({ success: true });
        
    }else{
     res.redirect("/login")
    }
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

const editaddress = async(req,res)=>{
    try {
        const id = req.query.id;
        const addaddresData = await Address.find({_id:id} );
        console.log(addaddresData);
        const userData = await User.findById(req.session.user_id);
        if (userData) {
            res.render("editAddress", { user: userData ,addr:addaddresData });
        }
        
    } catch (error) {
        console.log(error.message);
    res.status(500).json({ error: "Internal server error" }); 
    }
}

const editaddress2 = async(req,res)=>{
    try {
        const id = req.query.id;
        const addaddresData = await Address.find({_id:id} );
        console.log(addaddresData);
        const userData = await User.findById(req.session.user_id);
        if (userData) {
            res.render("editAddress2", { user: userData ,addr:addaddresData });
        }
        
    } catch (error) {
        console.log(error.message);
    res.status(500).json({ error: "Internal server error" }); 
    }
}
const updteaddress2 = async (req, res) => {
    try {
        const addressId = req.body.id;
        console.log(addressId);
        const userId = req.session.user_id;
console.log(userId);
        const updated = await Address.updateOne(
            { "user": userId, "_id": addressId }, // Find the user and the specific address by its ID
            {
                $set: {
                    "name": req.body.name,
                    "mobile": req.body.mobile,
                    "email": req.body.email,
                    "houseName": req.body.houseName,
                    "city": req.body.city,
                    "state": req.body.state,
                    "pin": req.body.pin,
                },
            }
        );

        console.log(updated);

        res.json({ success: true });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};
const removeAddress = async (req, res) => {
    try {
      const id = req.body.id;
      console.log('Removing address with ID:', id);
  
      const result = await Address.deleteOne(
        { user: req.session.user_id },
      { address: { _id: id } } 
      );
  
      console.log('Update result:', result);
  
      
        res.json({ remove: true });
    
    } catch (error) {
      console.log(error.message);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
  
  

  


module.exports = {
    editProfile,
    addaddres,
    addresAdd,
    editaddress,
    addaddres2,
    addresAdd1,
    editaddress2,
    updteaddress2,
    removeAddress


}