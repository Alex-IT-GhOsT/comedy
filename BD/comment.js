import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
    film_id: String,
    user_id: String,
    text: String,
    created_at: Number
})

const Comment = mongoose.model('comment',commentSchema)
export default Comment;