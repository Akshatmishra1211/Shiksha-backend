import TryCatch from "../middlewares/TryCatch.js";
import { Courses } from "../models/Courses.js";
import { Lecture } from "../models/Lecture.js";
import { rm } from "fs";
import { promisify } from "util";
import fs from "fs";
import { User } from "../models/User.js";

export const createCourse = TryCatch(async (req, res) => {
  const { title, description, category, createdBy, duration, price } = req.body;   // from form in frontend 

  const image = req.file;

  await Courses.create({     // add a course in courses model
    title,
    description,
    category,
    createdBy,
    image: image?.path,
    duration,
    price,
  });

  res.status(201).json({
    message: "Course Created Successfully",
  });
});

export const addLectures = TryCatch(async (req, res) => {
  const course = await Courses.findById(req.params.id);    // find a course with the id

  if (!course)
    return res.status(404).json({
      message: "No Course with this id",
    });

  const { title, description } = req.body;

  const file = req.file;   // handled by multer

  const lecture = await Lecture.create({     // add lecture in lectures section created in model "created at" is automatically imported for all lectures 
    title,
    description,
    video: file?.path,
    course: course._id,
  });

  res.status(201).json({
    message: "Lecture Added",
    lecture,
  });
});

export const deleteLecture = TryCatch(async (req, res) => {
  const lecture = await Lecture.findById(req.params.id);    // find a lecture with the specific id in url /api/lecture/:id

  rm(lecture.video, () => {        // rm is the node.js function used to delete any files including videos
    console.log("Video deleted");
  });

  await lecture.deleteOne();     // deletes the lecture data from mongodb

  res.json({ message: "Lecture Deleted" });
});

const unlinkAsync = promisify(fs.unlink);    // promisify made it to work with async like in line 75

export const deleteCourse = TryCatch(async (req, res) => {
  const course = await Courses.findById(req.params.id);

  const lectures = await Lecture.find({ course: course._id });

  await Promise.all(                      // to loop over all lectures
    lectures.map(async (lecture) => {
      await unlinkAsync(lecture.video);      // to delete a video file
      console.log("video deleted");
    })
  );

  rm(course.image, () => {            // to delete a course->image from the uploads folder earlier used to delete a lecture video
    console.log("image deleted");
  });

  await Lecture.find({ course: req.params.id }).deleteMany();    // delete all lecture of the course with id

  await course.deleteOne();    // delete course from mongodb

  await User.updateMany({}, { $pull: { subscription: req.params.id } });

  res.json({
    message: "Course Deleted",
  });
});

export const getAllStats = TryCatch(async (req, res) => {
  const totalCoures = (await Courses.find()).length;
  const totalLectures = (await Lecture.find()).length;
  const totalUsers = (await User.find()).length;

  const stats = {
    totalCoures,
    totalLectures,
    totalUsers,
  };

  res.json({
    stats,
  });
});

export const getAllUser = TryCatch(async (req, res) => {                    // get all users except the currently logged-in user
  const users = await User.find({ _id: { $ne: req.user._id } }).select(     // find users where _id is $ne(not equal) to req.user._id(currently logged in user)
    "-password"          //  tells Mongoose to exclude the password field from the result. "-" means "do not include".
  );

  res.json({ users });
});

export const updateRole = TryCatch(async (req, res) => {
  if (req.user.mainrole !== "superadmin")      // no admin can change the role of super admin
    return res.status(403).json({
      message: "This endpoint is assign to superadmin",
    });
  const user = await User.findById(req.params.id);

  if (user.role === "user") {
    user.role = "admin";
    await user.save();

    return res.status(200).json({
      message: "Role updated to admin",
    });
  }

  if (user.role === "admin") {
    user.role = "user";
    await user.save();

    return res.status(200).json({
      message: "Role updated",
    });
  }
});
