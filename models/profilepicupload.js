const { DataTypes } = require("sequelize");
const sequelize = require("./index");
const { v4: uuidv4 } = require("uuid");

const ProfilePicUpload = sequelize.define(
  "ProfilePicUpload",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: uuidv4,
      primaryKey: true,
    },
    filename: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    path: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    uploaded_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "profile_pics",
    timestamps: false,
  }
);

module.exports = ProfilePicUpload;
