import mongoose, { model, Schema } from "mongoose";

/**
 * @lessonSchema - Mongoose schema for Lesson.
 * This schema defines the structure and validation rules for lesson data, including title, content, video URL, and metadata.
 */

const lessonSchema = new Schema(
  {
    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Module", // Referencing the course this lesson belongs to
      required: true,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      minLength: [8, "Title must be at least 8 characters"],
      maxLength: [60, "Title should be less than 60 characters"],
      trim: true,
    },
    videoUrl: {
      type: String,
      required: [true, "Video URL is required"],
      trim: true,
      validate: {
        validator: function(v) {
          return /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/.test(v); // Basic URL validation
        },
        message: props => `${props.value} is not a valid URL!`
      },
    },
  },
  {
    timestamps: true,
  }
);

const Lesson = model("Lesson", lessonSchema);

export default Lesson;
