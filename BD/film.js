import mongoose from "mongoose";
const film = new mongoose.Schema({
    title: String,
    rate: Number,
    year: Number,
    country: String,
    genre: String,
    duration: Number,
    premiere: String,
    quality: String,
    full_description: String,
    short_description: String,
    img: String,
    url: String,
    actors: Array,
    director: String,
    totalVotes: {type: Number, default: 0 },
    totalRating: {type: Number, default: 0 },
    averageRating: {type: Number, default: 0 },
})
const SchemaFilm = mongoose.model('films',film)
export default SchemaFilm;