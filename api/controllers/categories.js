const mongoose = require("mongoose");
const Category = require("../models/category");
const fs = require("fs");

// Delete category image
function deleteCategoryImage(categoryImage) {
  fs.unlink(categoryImage, (err) => {
    if (err) console.log(err);
    else {
      console.log("Category Image Deleted");
    }
  });
}

module.exports = {
  getCategories: (req, res) => {
    let titleRegExp, genderRegExp;
    const title = req.query.title;
    const gender = req.query.gender;

    title ? (titleRegExp = `${title}`) : (titleRegExp = "");

    //Check if get gender param and build the regex
    gender ? (genderRegExp = `^${gender}$`) : (genderRegExp = "");

    Category.find({
      $and: [
        { title: new RegExp(titleRegExp, "i") },
        { gender: new RegExp(genderRegExp, "i") }
      ],
    })
      .then((categories) => {
        res.status(200).json({
          categories,
        });
      })
      .catch((error) => {
        res.status(500).json({
          error,
        });
      });
  },
  createCategory: (req, res) => {
    const { path: image } = req.file;
    const { title, description, gender } = req.body;

    const category = new Category({
      _id: new mongoose.Types.ObjectId(),
      title,
      description,
      gender,
      image: image.split("\\").join("/"),
    });

    category
      .save()
      .then(() => {
        res.status(200).json({
          message: "Created category",
        });
      })
      .catch((error) => {
        // If upload image than delete it
        if (image) {
          deleteCategoryImage(image);
        }
        res.status(500).json({
          error,
        });
      });
  },
  getCategory: (req, res) => {
    const categoryId = req.params.categoryId;

    Category.findById(categoryId)
      .then((category) => {
        res.status(200).json({
          category,
        });
      })
      .catch((error) => {
        res.status(500).json({
          error,
        });
      });
  },
  updateCategory: (req, res) => {
    const categoryId = req.params.categoryId;
    let categoryCurrImage;
    let image;

    // Check if upload image to replace current image
    if (req.file) {
      image = req.file.path;
      req.body.image = image.split("\\").join("/");
    }

    // Check if gender is valid
    if (
      req.body.gender &&
      req.body.gender.toLowerCase() != "men" &&
      req.body.gender.toLowerCase() != "women"
    ) {
      // If upload image than delete it
      if (image) {
        deleteCategoryImage(image);
      }
      return res.status(500).json({
        message: "Gender is not valid (gender can be men or women)",
      });
    }

    Category.findById(categoryId)
      .then((category) => {
        if (!category) {
          // If upload image than delete it
          if (image) {
            deleteCategoryImage(image);
          }
          return res.status(404).json({
            message: "Category not found",
          });
        }
        categoryCurrImage = category.image;
        Category.updateOne({ _id: categoryId }, req.body)
          .then(() => {
            // Check if replace image than delete old one
            if (image) {
              deleteCategoryImage(categoryCurrImage);
            }
            res.status(200).json({
              message: "Category Updated",
            });
          })
          .catch((error) => {
            // If upload image than delete it
            if (image) {
              deleteCategoryImage(image);
            }
            return res.status(500).json({
              error,
            });
          });
      })
      .catch((error) => {
        // If upload image than delete it
        if (image) {
          deleteCategoryImage(image);
        }
        return res.status(500).json({
          error,
        });
      });
  },
  deleteCategory: (req, res) => {
    const categoryId = req.params.categoryId;
    let categoryImage;
    if (categoryId == "603a54b22ff97741a8b54d80") {
      return res.status(400).json({
        message: "Scrape category can't be deleted",
      });
    }

    Category.findById(categoryId)
      .then((category) => {
        if (!category) {
          return res.status(404).json({
            message: "Category not found",
          });
        }
        categoryImage = category.image;
        Category.deleteOne({ _id: categoryId })
          .then(() => {
            // Delete category image
            deleteCategoryImage(categoryImage);
            return res.status(200).json({
              message: `Category _id:${categoryId} Deleted`,
            });
          })
          .catch((error) => {
            res.status(500).json({
              error,
            });
          });
      })
      .catch((error) => {
        res.status(500).json({
          error,
        });
      });
  }
};
