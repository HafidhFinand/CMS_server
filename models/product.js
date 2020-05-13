'use strict';
module.exports = (sequelize, DataTypes) => {

  const Model = sequelize.Sequelize.Model;

  class Product extends Model {}

  Product.init({
    name: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          args: true,
          msg: `Name can't be empty`
        }
      }
    },
    price: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          args: true,
          msg: `Price can't be empty`
        },
        min: {
          args: 1,
          msg: `Minimum price is 1`
        }
      }
    },
    stock: {
      type: DataTypes.INTEGER,
      validate: {
        notEmpty: {
          args: true,
          msg: `Stock can't be empty`
        },
        min: {
          args: 1,
          msg: `Minimum stock is 1`
        }
      }
    },
    image_url: DataTypes.STRING,
    description: DataTypes.STRING,
    UserId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Product'
  });

  Product.associate = function(models) {
    Product.belongsTo(models.User, { foreignKey: 'UserId', targetKey: 'id' });
  };
  return Product;
};