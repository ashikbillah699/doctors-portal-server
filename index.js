const express = require('express');
const cors = require('cors')
const app = express()
require('dotenv').config()
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require('mongodb');

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hellow world')
})


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rhwxyri.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        const appointmentOptionCollection = client.db('doctorsportal').collection('appointmentdata');
        const bookingCollection = client.db('doctorsportal').collection('bookingAppointment');

        app.get('/appointmentOptions', async (req, res) => {
            const date = req.query.date;
            console.log(date)
            const query = {};
            const cursor = appointmentOptionCollection.find(query);
            const options = await cursor.toArray();
            const bookingQuary = { appointment: date };
            const allreadyBooked = await bookingCollection.find(bookingQuary).toArray();
            options.forEach(option => {
                const optionBooked = allreadyBooked.filter(book => book.treatment === option.name);
                const bookSlot = optionBooked.map(book => book.slot)
                const remainingSlots = option.slots.filter(slot => !bookSlot.includes(slot))
                option.slots = remainingSlots;
                console.log(remainingSlots)

            });
            res.send(options);
        })

        app.post('/bookings', async (req, res) => {
            const booking = req.body;
            const query = {
                appointment: booking.appointment,
                email: booking.email,
                treatment: booking.treatment
            }

            const allReadyBooked = await bookingCollection.find(query).toArray()

            if (allReadyBooked.length) {
                const message = `You have a booking on ${booking.appointment}`
                return res.send({ acknowledged: false, message })
            }

            const result = await bookingCollection.insertOne(booking);
            res.send(result);
        })
    }
    finally {

    }
}
run().catch(console.dir);


app.listen(port, () => {
    console.log(`explore server port ${port}`)
})