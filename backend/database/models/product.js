import mongoose from 'mongoose'


const { Schema } = mongoose

const ProductSchema = new Schema({
  category: {
    type: String,
    required: true,
    enum: ['action figure', 'none'],
    default: 'none',
  },
  size:{
    type:String,
    required:true,
    enum:['XS','S','M','L','XL','Onesize']
  },
  description:{
    type:String,
    required:true,
    minlength:20,
    maxlength:200,
    default:'A very little short description of the searched product is available.'
  },
  actualPrice:
  {
    type:Number,
    required:true,
    min:0
  },
  discount:
  {
    type:Number,
    max:50,
    min:0,
    required:true
  },
  tax:
  {
    type:Number,
    required:true,
    enum: [5,10,12.5,18,28]
  },
  quantityAvailable: {
    type: Number,
    required: true,
  },
  image: [
    {
      path: {
        type: String,
        required: true,
      },
    },
  ],
  delicacy: {
    type: String,
    required: true,
    enum: ['low', 'medium', 'high'],
    default: 'high',
  },
  name: {
    type: String,
    required: true,
  },
})

ProductSchema.virtual('discountedPrice').get(function(){
return (this.actualPrice)-(this.actualPrice*this.discount)/100
}) 

const Product = mongoose.model('Product', ProductSchema)
export default Product
