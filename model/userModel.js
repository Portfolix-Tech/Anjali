import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Define the user schema
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true, // Ensures each username is unique
      trim: true,
      minlength: [3, "Username must be at least 3 characters long"],
      maxlength: [30, "Username must be at most 30 characters long"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true, // Ensures each email is unique
      lowercase: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        "Please provide a valid email address",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
    },
    role: {
      type: String,
      enum: ["user", "admin"], // Only 'user' or 'admin' allowed for role
      default: "user", // Default role is 'user'
    },
    assignedCourses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
    ],
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

// Hash password before saving the user to the database
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next(); // Only hash if the password is new or modified
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare entered password with the hashed password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// Method to generate a JSON Web Token (JWT)
userSchema.methods.generateAuthToken = function () {
  const payload = { id: this._id, role: this.role };
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" }); // Set expiration to 1 hour
  return token;
};

// Create and export the User model based on the schema
export const User = mongoose.model("User", userSchema);
