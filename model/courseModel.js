import {model , Schema} from "mongoose";
import mongoose from "mongoose";
/**
 * @courseSchema - Mongoose schema for Course.
 * This schema defines the structure and validation rules for course data, including title, description, category, thumbnail, lectures, and metadata.
 */

const courseSchema = new Schema({
    title:{
        type:String,
        required:[true, "Title is required" ],
        minLength:[8, "Title must be atleast 8 characters"],
        maxLength:[60,"Title should be less than 60 characters"],
        trim:true
    },
    description:{
        type: String,
        required:[true, "Description is required" ],
        minLength:[8, "Description must be atleast 8 characters"],
        maxLength:[200,"Description should be less than 200 characters"],
        trim:true
    },
    thumbnail:{
        public_id:{
            type:String,
            required:true,
        },
        secure_url:{
            type:String,
            required:true,
        }
    },
    modules: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Module', // Reference to the 'Module' model
      }],
    createdBy:{
        type:String,
        required:true,
    }

},{
    timestamps:true
})

const Course = model('Course', courseSchema);

export default Course;