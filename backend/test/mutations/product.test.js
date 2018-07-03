/* eslint-env jest */

import { ValidationError, Types } from 'mongoose'

import Product from '../../database/models/product'
import User from '../../database/models/user'
import {
  addProductResolver,
  removeProductResolver,
  updateProductInfoResolver,
  updateProductImagesResolver,
  updateProductQuantityResolver,
} from '../../graphql/resolvers/productResolvers'
import { merge, pick } from '../../utils'
import { connectMongoose, disconnectMongoose } from '../helper'

beforeAll(connectMongoose)
afterAll(disconnectMongoose)

describe('addProduct resolver', () => {
  const user = {
    _id: '5b39f7bb26670102359a8c10',
  }

  const dummyProduct = {
    name: 'Handcrafted Plastic Computer',
    category: 'Shoes',
    size: [
      {
        label: 'XS',
        quantityAvailable: 5,
      },
      {
        label: 'M',
        quantityAvailable: 10,
      },
    ],
    description: 'Eum sunt dicta enim animi enim.',
    actualPrice: 984.99,
    discount: 5,
    tax: 12.5,
    imagePath: [
      'Optio labore laudantium et et a eaque sed',
      'Neque non ullam nam qui corrupti similique officia aut quis',
      'Et explicabo aut dicta',
    ],
    delicacy: 'medium',
  }

  it('Should add a product', async () => {
    expect.assertions(2)
    const savedUser = await User.findById(user._id)
    const product = await addProductResolver(null, dummyProduct, {
      user: savedUser,
    })
    expect(product).toHaveProperty('_id')
    // Hack so as to do a deep comparison of the two objects.
    expect(JSON.parse(JSON.stringify(product))).toMatchObject(dummyProduct)
  })

  it('Should not add a product when there is no user', async () => {
    expect.assertions(1)
    await expect(addProductResolver(null, dummyProduct, {})).rejects.toThrow(
      'Unauthorized'
    )
  })

  it(`Should not add a product when 'required' fields are missing`, async () => {
    expect.assertions(1)
    // Name is going to be missing.
    const incompleteProduct = pick(dummyProduct, [
      'category',
      'size',
      'description',
      'actualPrice',
      'discount',
      'tax',
      'imagePath',
      'delicacy',
    ])
    const savedUser = await User.findById(user._id)
    await expect(
      addProductResolver(null, incompleteProduct, { user: savedUser })
    ).rejects.toThrowError(ValidationError)
  })

  it(`Should not add a product when 'category' is invalid`, async () => {
    expect.assertions(1)
    const invalidCategoryProduct = merge(dummyProduct, {
      category: 'Designer THX',
    })
    const savedUser = await User.findById(user._id)
    await expect(
      addProductResolver(null, invalidCategoryProduct, { user: savedUser })
    ).rejects.toThrowError(ValidationError)
  })

  it(`Should not add a product with an empty 'size' array`, async () => {
    expect.assertions(1)
    const invalidSizeProduct = merge(dummyProduct, { size: [] })
    const savedUser = await User.findById(user._id)
    await expect(
      addProductResolver(null, invalidSizeProduct, { user: savedUser })
    ).rejects.toThrowError(ValidationError)
  })

  it(`Should not add a product when 'size' field is missing`, async () => {
    expect.assertions(1)
    const invalidSizeProduct = pick(dummyProduct, [
      'name',
      'category',
      'description',
      'actualPrice',
      'discount',
      'tax',
      'imagePath',
      'delicacy',
    ])
    const savedUser = await User.findById(user._id)
    await expect(
      addProductResolver(null, invalidSizeProduct, { user: savedUser })
    ).rejects.toThrowError(ValidationError)
  })

  it(`Should not add a product when 'size' field has objects with duplicate labels`, async () => {
    expect.assertions(1)
    const invalidSizeProduct = merge(dummyProduct, {
      size: [
        { label: 'XL', quantityAvailable: 5 },
        { label: 'S', quantityAvailable: 10 },
        { label: 'XL', quantityAvailable: 8 },
      ],
    })
    const savedUser = await User.findById(user._id)
    await expect(
      addProductResolver(null, invalidSizeProduct, { user: savedUser })
    ).rejects.toThrowError(ValidationError)
  })

  it(`Should not add a product when 'size' field has objects with invalid quantity`, async () => {
    expect.assertions(1)
    const invalidSizeProduct = merge(dummyProduct, {
      size: [
        { label: 'XL', quantityAvailable: 5 },
        { label: 'S', quantityAvailable: -15 },
      ],
    })
    const savedUser = await User.findById(user._id)
    await expect(
      addProductResolver(null, invalidSizeProduct, { user: savedUser })
    ).rejects.toThrowError(ValidationError)
  })

  it(`Should add a product when 'description' field is missing`, async () => {
    expect.assertions(4)
    const validProduct = pick(dummyProduct, [
      'name',
      'category',
      'size',
      'actualPrice',
      'discount',
      'tax',
      'imagePath',
      'delicacy',
    ])
    const savedUser = await User.findById(user._id)
    const savedProduct = await addProductResolver(null, validProduct, {
      user: savedUser,
    })
    expect(savedProduct).toHaveProperty('_id')
    expect(savedProduct).toHaveProperty('description')
    expect(savedProduct.description).toEqual(
      'A very little short description of the searched product is available.'
    )
    expect(JSON.parse(JSON.stringify(savedProduct))).toMatchObject(
      merge(validProduct, {
        description:
          'A very little short description of the searched product is available.',
      })
    )
  })

  it(`Should add a product when 'discount', 'tax' and 'delicacy' fields are missing`, async () => {
    expect.assertions(7)
    const validProduct = pick(dummyProduct, [
      'name',
      'category',
      'size',
      'actualPrice',
      'imagePath',
    ])
    const savedUser = await User.findById(user._id)
    const savedProduct = await addProductResolver(null, validProduct, {
      user: savedUser,
    })
    expect(savedProduct).toHaveProperty('_id')
    expect(savedProduct).toHaveProperty('discount')
    expect(savedProduct).toHaveProperty('tax')
    expect(savedProduct).toHaveProperty('delicacy')
    expect(savedProduct.discount).toBe(0)
    expect(savedProduct.tax).toBe(5)
    expect(savedProduct.delicacy).toBe('high')
  })

  it(`Should not add a product with an empty 'imagePath' array`, async () => {
    expect.assertions(1)
    const invalidSizeProduct = merge(dummyProduct, { size: [] })
    const savedUser = await User.findById(user._id)
    await expect(
      addProductResolver(null, invalidSizeProduct, { user: savedUser })
    ).rejects.toThrowError(ValidationError)
  })

  it(`Should not add a product when 'imagePath' field is missing`, async () => {
    expect.assertions(1)
    const invalidImageProduct = pick(dummyProduct, [
      'name',
      'category',
      'size',
      'description',
      'actualPrice',
      'discount',
      'tax',
      'delicacy',
    ])
    const savedUser = await User.findById(user._id)
    await expect(
      addProductResolver(null, invalidImageProduct, { user: savedUser })
    ).rejects.toThrowError(ValidationError)
  })

  it(`Should not add a product when 'imagePath' field has more than 5 images`, async () => {
    expect.assertions(1)
    const tooManyImagesProduct = merge(dummyProduct, {
      imagePath: [
        ...dummyProduct.imagePath,
        'Qui quis necessitatibus et eius',
        'Possimus laudantium tenetur eligendi rerum et deserunt illo et eveniet',
        'Fuga qui adipisci et qui',
      ],
    })
    const savedUser = await User.findById(user._id)
    await expect(
      addProductResolver(null, tooManyImagesProduct, { user: savedUser })
    ).rejects.toThrowError(ValidationError)
  })
})

describe('updateProductInfo resolver', async () => {
  const user = {
    _id: '5b39f7bb26670102359a8c10',
  }

  const updatePayload = {
    name: 'Awesome Plastic Pizza',
    category: 'Gloves',
    size: [
      {
        label: 'S',
        quantityAvailable: 5,
      },
      {
        label: 'L',
        quantityAvailable: 10,
      },
      {
        label: 'XL',
        quantityAvailable: 3,
      },
    ],
    description: 'Omnis reiciendis expedita iure consequatur non.',
    actualPrice: 735.61,
    discount: 10,
    tax: 18,
    imagePath: [
      'Voluptatem nostrum autem.',
      'Ut possimus maiores placeat voluptate quam accusantium aut.',
      'Numquam at sed quo autem velit optio.',
      'Quisquam incidunt fugit vel eos at et alias maiores perspiciatis.',
    ],
    delicacy: 'low',
  }

  it(`Should update a product's 'name', 'category', 'description', 'actualPrice', 'discount', 'tax' and 'delicacy' fields`, async () => {
    expect.assertions(19)
    const savedUser = await User.findById(user._id)
    const products = await Product.find({})
    const productIndex = Math.floor(Math.random() * products.length)
    const productArgs = merge(updatePayload, { id: products[productIndex]._id })

    const product = await updateProductInfoResolver(null, productArgs, {
      user: savedUser,
    })

    expect(product).toHaveProperty('_id')
    expect(product).toHaveProperty('name')
    expect(product.name).toBe(updatePayload.name)
    expect(product).toHaveProperty('category')
    expect(product.category).toBe(updatePayload.category)
    expect(product).toHaveProperty('description')
    expect(product.description).toBe(updatePayload.description)
    expect(product).toHaveProperty('actualPrice')
    expect(product.actualPrice).toBe(updatePayload.actualPrice)
    expect(product).toHaveProperty('discount')
    expect(product.discount).toBe(updatePayload.discount)
    expect(product).toHaveProperty('tax')
    expect(product.tax).toBe(updatePayload.tax)
    expect(product).toHaveProperty('delicacy')
    expect(product.delicacy).toBe(updatePayload.delicacy)
    expect(product).toHaveProperty('size')
    expect(product.size.length).toBe(products[productIndex].size.length)
    expect(product).toHaveProperty('imagePath')
    expect(product.imagePath.length).toBe(
      products[productIndex].imagePath.length
    )

    // Cleanup.
    await Product.findByIdAndUpdate(
      products[productIndex]._id,
      products[productIndex],
      { new: true, runValidators: true }
    )
  })

  it('Should not update a product when there is no user', async () => {
    expect.assertions(1)
    const products = await Product.find({})
    const productIndex = Math.floor(Math.random() * products.length)
    const productArgs = merge(updatePayload, { id: products[productIndex]._id })

    await expect(
      updateProductInfoResolver(null, productArgs, {})
    ).rejects.toThrow('Unauthorized')
  })

  it(`Should not update a product that doesn't exist`, async () => {
    expect.assertions(1)
    const savedUser = await User.findById(user._id)
    const productArgs = merge(updatePayload, { id: new Types.ObjectId() })
    const updatedProduct = await updateProductInfoResolver(null, productArgs, {
      user: savedUser,
    })
    expect(updatedProduct).toBeNull()
  })

  it(`Should not update a product's 'imagePath' field`, async () => {
    expect.assertions(14)
    const savedUser = await User.findById(user._id)
    const products = await Product.find({})
    const productIndex = Math.floor(Math.random() * products.length)
    const oldProduct = products[productIndex]
    const productArgs = merge(pick(updatePayload, ['imagePath']), {
      id: oldProduct._id,
    })

    const updatedProduct = await updateProductInfoResolver(null, productArgs, {
      user: savedUser,
    })

    expect(updatedProduct).toHaveProperty('_id')
    expect(updatedProduct).toHaveProperty('name')
    expect(updatedProduct.name).not.toEqual(updatePayload.name)
    expect(updatedProduct).toHaveProperty('category')
    expect(updatedProduct.category).not.toEqual(updatePayload.category)
    expect(updatedProduct).toHaveProperty('description')
    expect(updatedProduct).not.toEqual(updatePayload.description)
    expect(updatedProduct).toHaveProperty('discount')
    expect(updatedProduct.discount).not.toEqual(updatePayload.discount)
    expect(updatedProduct).toHaveProperty('imagePath')
    expect(updatedProduct.imagePath.length).not.toBe(0)
    expect(updatedProduct.imagePath.length).not.toBe(
      updatePayload.imagePath.length
    )

    const oldImages = oldProduct.imagePath.map(image => image.toString())
    const newImages = updatedProduct.imagePath.map(image => image.toString())
    expect(updatedProduct.imagePath.length).toBe(oldProduct.imagePath.length)
    expect(newImages).toEqual(oldImages)
  })

  it(`Should not update a product's 'size' field`, async () => {
    expect.assertions(14)
    const savedUser = await User.findById(user._id)
    const products = await Product.find({})
    const productIndex = Math.floor(Math.random() * products.length)
    const oldProduct = products[productIndex]
    const productArgs = merge(pick(updatePayload, ['size']), {
      id: oldProduct._id,
    })

    const updatedProduct = await updateProductInfoResolver(null, productArgs, {
      user: savedUser,
    })

    expect(updatedProduct).toHaveProperty('_id')
    expect(updatedProduct).toHaveProperty('name')
    expect(updatedProduct.name).not.toEqual(updatePayload.name)
    expect(updatedProduct).toHaveProperty('category')
    expect(updatedProduct.category).not.toEqual(updatePayload.category)
    expect(updatedProduct).toHaveProperty('description')
    expect(updatedProduct).not.toEqual(updatePayload.description)
    expect(updatedProduct).toHaveProperty('discount')
    expect(updatedProduct.discount).not.toEqual(updatePayload.discount)
    expect(updatedProduct).toHaveProperty('size')
    expect(updatedProduct.size.length).not.toBe(0)
    expect(updatedProduct.size.length).not.toBe(updatePayload.size.length)

    const oldSizes = oldProduct.size.map(size => ({
      label: size.label,
      quantityAvailable: size.quantityAvailable,
    }))
    const newSizes = updatedProduct.size.map(size => ({
      label: size.label,
      quantityAvailable: size.quantityAvailable,
    }))

    expect(updatedProduct.size.length).toBe(oldProduct.size.length)
    expect(newSizes).toEqual(oldSizes)
  })
})

describe('updateProductImages resolver', () => {
  const user = {
    _id: '5b39f7bb26670102359a8c10',
  }

  const updatePayload = {
    name: 'Awesome Plastic Pizza',
    category: 'Gloves',
    size: [
      {
        label: 'S',
        quantityAvailable: 5,
      },
      {
        label: 'L',
        quantityAvailable: 10,
      },
      {
        label: 'XL',
        quantityAvailable: 3,
      },
    ],
    description: 'Omnis reiciendis expedita iure consequatur non.',
    actualPrice: 735.61,
    discount: 10,
    tax: 18,
    imagePath: [
      'Voluptatem nostrum autem.',
      'Ut possimus maiores placeat voluptate quam accusantium aut.',
      'Numquam at sed quo autem velit optio.',
      'Quisquam incidunt fugit vel eos at et alias maiores perspiciatis.',
    ],
    delicacy: 'low',
  }

  it(`Should update a product's 'imagePath' field`, async () => {
    expect.assertions(6)
    const savedUser = await User.findById(user._id)
    const products = await Product.find({})
    const productIndex = Math.floor(Math.random() * products.length)
    const oldProduct = products[productIndex]
    const productArgs = merge(updatePayload, {
      id: oldProduct._id,
    })

    const updatedProduct = await updateProductImagesResolver(
      null,
      productArgs,
      {
        user: savedUser,
      }
    )

    expect(updatedProduct).toHaveProperty('_id')
    expect(updatedProduct).toHaveProperty('imagePath')
    const oldImages = oldProduct.imagePath.map(image => image.toString())
    const newImages = updatedProduct.imagePath.map(image => image.toString())
    expect(updatedProduct.imagePath.length).not.toBe(
      oldProduct.imagePath.length
    )
    expect(newImages).not.toEqual(oldImages)
    expect(newImages).toContain(productArgs.imagePath[0])
    expect(newImages).not.toContain(oldImages[0])

    // Cleanup.
    await Product.findByIdAndUpdate(oldProduct._id, oldProduct, {
      new: true,
      runValidators: true,
    })
  })

  it('Should not update a product when there is no user', async () => {
    expect.assertions(1)
    const products = await Product.find({})
    const productIndex = Math.floor(Math.random() * products.length)
    const productArgs = merge(pick(updatePayload, ['imagePath']), {
      id: products[productIndex]._id,
    })

    await expect(
      updateProductImagesResolver(null, productArgs, {})
    ).rejects.toThrow('Unauthorized')
  })

  it(`Should not update a product that doesn't exist`, async () => {
    expect.assertions(1)
    const savedUser = await User.findById(user._id)
    const productArgs = merge(updatePayload, { id: new Types.ObjectId() })
    const updatedProduct = await updateProductImagesResolver(
      null,
      productArgs,
      {
        user: savedUser,
      }
    )
    expect(updatedProduct).toBeNull()
  })

  it(`Should not update a product's any other field`, async () => {
    expect.assertions(12)
    const savedUser = await User.findById(user._id)
    const products = await Product.find({})
    const productIndex = Math.floor(Math.random() * products.length)
    const oldProduct = products[productIndex]
    const productArgs = merge(
      pick(updatePayload, ['name', 'category', 'size']),
      { id: oldProduct._id }
    )

    const updatedProduct = await updateProductImagesResolver(
      null,
      productArgs,
      {
        user: savedUser,
      }
    )

    expect(updatedProduct).toHaveProperty('_id')
    expect(updatedProduct).toHaveProperty('name')
    expect(updatedProduct.name).toEqual(oldProduct.name)
    expect(updatedProduct.name).not.toEqual(updatePayload.name)
    expect(updatedProduct).toHaveProperty('category')
    expect(updatedProduct.category).toEqual(oldProduct.category)
    expect(updatedProduct.category).not.toEqual(updatePayload.category)
    expect(updatedProduct).toHaveProperty('size')
    expect(updatedProduct.size.length).not.toBe(0)
    expect(updatedProduct.size.length).not.toBe(updatePayload.size.length)

    const oldSizes = oldProduct.size.map(size => ({
      label: size.label,
      quantityAvailable: size.quantityAvailable,
    }))
    const newSizes = updatedProduct.size.map(size => ({
      label: size.label,
      quantityAvailable: size.quantityAvailable,
    }))

    expect(updatedProduct.size.length).toBe(oldProduct.size.length)
    expect(newSizes).toEqual(oldSizes)
  })
})

describe('updateProductQuantity resolver', () => {
  const user = {
    _id: '5b39f7bb26670102359a8c10',
  }

  const updatePayload = {
    name: 'Awesome Plastic Pizza',
    category: 'Gloves',
    size: [
      {
        label: 'S',
        quantityAvailable: 5,
      },
      {
        label: 'L',
        quantityAvailable: 10,
      },
      {
        label: 'XL',
        quantityAvailable: 3,
      },
    ],
    description: 'Omnis reiciendis expedita iure consequatur non.',
    actualPrice: 735.61,
    discount: 10,
    tax: 18,
    imagePath: [
      'Voluptatem nostrum autem.',
      'Ut possimus maiores placeat voluptate quam accusantium aut.',
      'Numquam at sed quo autem velit optio.',
      'Quisquam incidunt fugit vel eos at et alias maiores perspiciatis.',
    ],
    delicacy: 'low',
  }

  it(`Should update a product's 'size' field`, async () => {
    expect.assertions(6)
    const savedUser = await User.findById(user._id)
    const products = await Product.find({})
    const productIndex = Math.floor(Math.random() * products.length)
    const oldProduct = products[productIndex]
    const productArgs = merge(updatePayload, {
      id: oldProduct._id,
    })

    const updatedProduct = await updateProductQuantityResolver(
      null,
      productArgs,
      {
        user: savedUser,
      }
    )

    expect(updatedProduct).toHaveProperty('_id')
    expect(updatedProduct).toHaveProperty('size')
    expect(updatedProduct.size.length).not.toBe(0)

    const oldSizes = oldProduct.size.map(size => ({
      label: size.label,
      quantityAvailable: size.quantityAvailable,
    }))

    const expectedSizes = [...oldSizes]
    productArgs.size.forEach(newSize => {
      let sizeInCommon = false
      expectedSizes.forEach(oldSize => {
        if (oldSize.label === newSize.label) {
          sizeInCommon = true
          oldSize.quantityAvailable = newSize.quantityAvailable
        }
      })

      if (!sizeInCommon) {
        expectedSizes.push(newSize)
      }
    })

    const newSizes = updatedProduct.size.map(size => ({
      label: size.label,
      quantityAvailable: size.quantityAvailable,
    }))

    expect(newSizes.length).toBe(expectedSizes.length)
    expect(newSizes).toEqual(expectedSizes)
    expect(newSizes).not.toEqual(oldSizes)

    // Cleanup.
    await Product.findByIdAndUpdate(oldProduct._id, oldProduct, {
      new: true,
      runValidators: true,
    })
  })

  it('Should not update a product when there is no user', async () => {
    expect.assertions(1)
    const products = await Product.find({})
    const productIndex = Math.floor(Math.random() * products.length)
    const productArgs = merge(pick(updatePayload, ['size']), {
      id: products[productIndex]._id,
    })

    await expect(
      updateProductQuantityResolver(null, productArgs, {})
    ).rejects.toThrow('Unauthorized')
  })

  it(`Should not update a product that doesn't exist`, async () => {
    expect.assertions(1)
    const savedUser = await User.findById(user._id)
    const productArgs = merge(updatePayload, { id: new Types.ObjectId() })
    const updatedProduct = await updateProductQuantityResolver(
      null,
      productArgs,
      {
        user: savedUser,
      }
    )
    expect(updatedProduct).toBeNull()
  })

  it(`Should not update when 'size' field is missing`, async () => {
    expect.assertions(1)
    const savedUser = await User.findById(user._id)
    const products = await Product.find({})
    const productIndex = Math.floor(Math.random() * products.length)
    const oldProduct = products[productIndex]
    const productArgs = merge(
      pick(updatePayload, ['name', 'category', 'imagePath']),
      { id: oldProduct._id }
    )

    await expect(
      updateProductQuantityResolver(null, productArgs, {
        user: savedUser,
      })
    ).rejects.toThrow('Must provide label and quantity for size')
  })
})

describe('removeProduct resolver', () => {
  const user = {
    _id: '5b39f7bb26670102359a8c10',
  }

  it('Should remove a product', async () => {
    expect.assertions(1)
    const savedUser = await User.findById(user._id)
    const products = await Product.find({})
    const productIndex = Math.floor(Math.random() * products.length)
    const product = products[productIndex]

    const removedProduct = await removeProductResolver(
      null,
      { id: product._id },
      { user: savedUser }
    )
    // Hack to avoid hitting the call stack.
    expect(JSON.stringify(removedProduct)).toEqual(JSON.stringify(product))
  })

  it('Should not remove a product when there is no user', async () => {
    expect.assertions(1)
    const products = await Product.find({})
    const productIndex = Math.floor(Math.random() * products.length)
    const product = products[productIndex]

    await expect(removeProductResolver(null, product, {})).rejects.toThrow(
      'Unauthorized'
    )
  })

  it(`Should not remove a product that doesn't exist`, async () => {
    expect.assertions(1)
    const savedUser = await User.findById(user._id)
    const productID = new Types.ObjectId()

    const removedProduct = await removeProductResolver(
      null,
      { id: productID },
      { user: savedUser }
    )
    expect(removedProduct).toBeNull()
  })
})