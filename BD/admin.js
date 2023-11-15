import mongoose from "mongoose";

const ShemaAdmin = new mongoose.Schema({
    login: String,
    password: String
})

const Admins = mongoose.model('admin',ShemaAdmin);

export default Admins;