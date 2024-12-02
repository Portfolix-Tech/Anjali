import mongoose, { model, Schema } from "mongoose";

/**
 * @moduleSchema - Mongoose schema for Course.
 * This schema defines the structure and validation rules for course data, including title, description, category, thumbnail, lectures, and metadata.
 */

const moduleSchema = new Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      minLength: [8, "Title must be atleast 8 characters"],
      maxLength: [60, "Title should be less than 60 characters"],
      trim: true,
    },
    content: {
      type: String,
      required: [true, "Description is required"],
      minLength: [8, "Description must be atleast 8 characters"],
      maxLength: [200, "Description should be less than 200 characters"],
      trim: true,
    },
    lessons: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lesson', // Reference to the 'Module' model
      }],
  },
  {
    timestamps: true,
  }
);

const Module = model("Module", moduleSchema);

export default Module;
