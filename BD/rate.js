import mongoose from "mongoose";

const rateSchema = new mongoose.Schema({
    film_id: String,
    rate: Number,
    count: Number
})

const Rates = mongoose.model('rates',rateSchema)

export default Rates;