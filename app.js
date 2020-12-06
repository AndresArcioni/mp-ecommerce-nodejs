const express = require('express');
const app = express();
const exphbs  = require('express-handlebars');
const port = process.env.PORT || 3000

const mercadopago = require('mercadopago');
mercadopago.configure({
    access_token: 'APP_USR-6317427424180639-042414-47e969706991d3a442922b0702a0da44-469485398',
    integrator_id: 'dev_24c65fb163bf11ea96500242ac130004'
})

app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');

app.use(express.static('assets'));

app.use('/assets', express.static(__dirname + '/assets'));

app.get('/', function (req, res) {
    res.render('home');
});

app.get('/detail', function (req, res) {
    res.render('detail', req.query);
});

app.post('/buyConfirm', (req, res) => {

    let host = 'https://andresarcioni-mp-commerce-node.herokuapp.com/'
    let urlCb = 'callback?status='

    let preference = {
        back_urls : {
            success: host + urlCb + 'success',
            pending: host + urlCb + 'pending',
            failure: host + urlCb + 'failure'
        },
        auto_return: 'approved',//autoredireccion activada
        items: [{
            id: 1234,
            picture_url: 'https://andresarcioni-mp-commerce-node.herokuapp.com/assets/samsung-galaxy-s9-xxl.jpg',
            title: 'Nombre del producto seleccionado del carrito del ejercicio',
            description: 'Dispositivo móvil de Tienda e-commerce',
            unit_price: 994,//FLOAT
            quantity: 1//INTEGER
            //aca iría la consulta a la db; ~ este es un producto harcodeado ~
        }],
        external_reference: 'andresarcioni@gmail.com',
        notification_url: host + 'webhooks',
        payer: {//clientes/payer
            name: 'Lalo',
            surname: 'Landa',
            email: 'test_user_63274575@testuser.com',
            phone: {
                area_code: '11',
                number: 22223333,
            },
            address: {
                street_name: 'False',
                street_number: 123,
                zip_code: '1111'
            }
        },
        payment_methods: {
            excluded_payment_methods: [
                {id: 'amex'}//No permito American Express
            ],
            excluded_payment_types: [
                {id:'atm'}//No permito pagos en cajeros automaticos
            ],
            installments: 6//cantidad máxima de cuotas.
        }
    }

    mercadopago.preferences.create(preference).then(result => {
        res.render('confirm', {result:result.body})
    }).catch(error => {
        console.log(error)
        res.send('error')
    })

})

app.get('/cb', (req, res) => {
    if (req.query.status.includes('success')){
        return res.render('success', {
            payment_type: req.query.payment_type,
            external_reference: req.query.external_reference,
            collection_id: req.query.collection_id
        })
    }
    if (req.query.status.includes('pending')){
        return res.render('pending')
    }
    if (req.query.status.includes('failure')){
        return res.render('failure')
    }
    return res.status(404).end()
})

app.post('/webhooks', (req, res) => {
    console.log('webhook', req.body)
    res.status(200).send(req.body)
})



app.listen(port);