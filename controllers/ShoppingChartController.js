const { ShoppingChart } = require('../models')
const { Product } = require('../models')
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const { User } = require('../models')

class ShoppingChartController {
    static findShoppingChart (req, res, next) {
        const UserId = req.currentUserId
        const options = {
            where: {
                UserId,
                isPaid: false
            },
            order: [['id', 'asc']],
            include: [ Product ],
            attributes: ['id', 'UserId', 'quantity', 'ProductId']
        }
        async function getShoppingChart () {
            try {
                const shoppingchart = await ShoppingChart.findAll(options)
                res.status(200).json({
                    ShoppingCharts: shoppingchart
                })
            }
            catch(error) {
                next(error)
            }
        }
        getShoppingChart()
    }

    static createShoppingChart (req, res, next) {
        const { ProductId, quantity } = req.body
        const UserId = req.currentUserId
        
        async function createNewShoppingChart () {
            try {
                const options = {
                    where: {
                        UserId,
                        ProductId
                    },
                    attributes: ['id', 'UserId', 'quantity', 'ProductId']
                }
                const currentShoppingChart = await ShoppingChart.findOne(options)
                if (currentShoppingChart) {
                    if (quantity == 1) {
                        const shoppingChartvalues = {
                            UserId,
                            ProductId,
                            isPaid: false,
                            quantity: Number(quantity) + Number(currentShoppingChart.quantity)
                        }
                        const options = {
                            where: {
                                id: currentShoppingChart.id,
                            },
                            returning: true
                        }
                        const updatedShoppingChart = await ShoppingChart.update(shoppingChartvalues, options)
                        const currentStock = await Product.decrement({ stock: Number(quantity) }, { where: { id: ProductId } })
                        res.status(201).json({ ShoppingChart: updatedShoppingChart })
                    } else {
                        const shoppingChartvalues = {
                            UserId,
                            ProductId,
                            quantity,
                            isPaid: false
                        }
                        const options = {
                            where: {
                                id: currentShoppingChart.id,
                            },
                            returning: true
                        }
                        const updatedShoppingChart = await ShoppingChart.update(shoppingChartvalues, options)
                        const currentStock = await Product.decrement({ stock: Number(quantity) }, { where: { id: ProductId } })
                        res.status(201).json({ ShoppingChart: updatedShoppingChart })
                    }
                } else {
                    const shoppingChartvalues = {
                        UserId,
                        ProductId,
                        quantity,
                        isPaid: false
                    }
                    const newShopingChart = await ShoppingChart.create(shoppingChartvalues)
    
                    const currentStock = await Product.decrement({ stock: Number(quantity) }, { where: { id: ProductId } })
                    res.status(201).json({ ShoppingChart: newShopingChart })
                }
            }
            catch(error) {
                next(error)
            }
        }
        createNewShoppingChart()
    }

    static deleteShoppingChart (req, res, next) {
        const ShoppingChartId = req.params.id
        const ProductId = ''
        const options = {
            returning: true,
            where: {
                id: ShoppingChartId
            }
        }

        async function removeShoppingChart () {
            try {
                const shoppingchart = await ShoppingChart.findOne({ where: { id: ShoppingChartId } })
                const ProductId = shoppingchart.ProductId
                const quantity = shoppingchart.quantity

                const currentStock = await Product.increment({ stock: Number(quantity) }, { where: { id: ProductId } })
                const deletedShoppingChart = await ShoppingChart.destroy(options)
                
                res.status(200).json({ Result: 'Successfully Deleted' })
            }
            catch(error) {
                next (error)
            }
        }
        removeShoppingChart()
    }

    static checkout (req, res, next) {
        let { customerData, listProductId } = req.body
        console.log(customerData, listProductId)
        const UserId = Number(req.currentUserId) 
        listProductId = JSON.parse(listProductId)
        const checkout = []
        User
            .findByPk(UserId)
                .then(user => {
                    const email = user.email
                    return stripe.customers.create({
                        email: email,  
                    })
                })
                .then(customer => {
                    return stripe.invoiceItems.create({
                        amount: customerData.amount,
                        description: 'Buy Product from Toko Murah',
                        currency: 'idr',
                        customer: customer.id
                    })
                })
                .then(invoiceItem => {
                    return stripe.invoices.create({
                        collection_method: 'send_invoice',
                        customer: invoiceItem.customer,
                        days_until_due: 10
                    })
                })
                .then(invoice => {
                    return ShoppingChart
                        .findAll({
                            where: {
                                UserId,
                                isPaid: false
                            }
                        })
                })
                .then(products => {
                    products.forEach(element => {
                        checkout.push(
                            ShoppingChart
                                .update({
                                    isPaid: true
                                }, {
                                    where: {
                                        ProductId: element.ProductId,
                                    }
                                })
                        )
                    })
                    return Promise.all(checkout)
                })
                .then(() => {
                    res.status(200).json('berhasil')
                })
                .catch(err => {
                    console.log('ini error', err)
                })

    }
}

module.exports = ShoppingChartController