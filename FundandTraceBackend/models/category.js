const mongoose = require("mongoose");

const categorySchema = {
  category: { type: String, default: "", index: true },
  mainImage: { type: String, default: "" },
  heroHeading: { type: String, default: "" },
  heroText: { type: String, default: "" },
  chipData: [{ text: { type: String, default: "" } }],
  stories: [
    {
      image: { type: String, default: "" },
      heading: { type: String, default: "" },
      story: { type: String, default: "" },
      summary: { type: String, default: "" },
    },
  ],
};

const Category = mongoose.model("category", categorySchema);

module.exports = {
  Category,
};
