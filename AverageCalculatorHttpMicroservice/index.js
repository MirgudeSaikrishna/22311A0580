import express, { json } from 'express';
import cors from 'cors';
import fetch from 'node-fetch'; 
import 'dotenv/config'; 
const app = express();
app.use(cors());
app.use(json());
const token=process.env.token;

let windowPrevState = [];
let windowCurrState = [];
const WINDOW_SIZE = 10;
//const token="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiZXhwIjoxNzQ4MzI0NDU2LCJpYXQiOjE3NDgzMjQxNTYsImlzcyI6IkFmZm9yZG1lZCIsImp0aSI6Ijc1MmVlYmE2LWEyZWQtNDdlMC1iZTExLTUyZDIwYjVjMmM0MyIsInN1YiI6IjIyMzExYTA1ODBAY3NlLnNyZWVuaWRoaS5lZHUuaW4ifSwiZW1haWwiOiIyMjMxMWEwNTgwQGNzZS5zcmVlbmlkaGkuZWR1LmluIiwibmFtZSI6Im1pcmd1ZGUgc2Fpa3Jpc2huYSIsInJvbGxObyI6IjIyMzExYTA1ODAiLCJhY2Nlc3NDb2RlIjoiUENxQVVLIiwiY2xpZW50SUQiOiI3NTJlZWJhNi1hMmVkLTQ3ZTAtYmUxMS01MmQyMGI1YzJjNDMiLCJjbGllbnRTZWNyZXQiOiJxTUZWeXZQeXdoaEJCYnByIn0.NM4Di6att1oE7BYGEkvPBoJrltoZ-DrdqXTp21Z3JIs"


app.get('/numbers/:id', async (req, res) => {
    var id = req.params.id;
    if(id === 'f') id='fibo';
    else if(id === 'p') id='primes';
    else if(id === 'e') id='even';
    else if(id === 'r') id='rand';
    try {
        const response = await fetch(`http://20.244.56.144/evaluation-service/${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            return res.status(response.status).json({ error: 'Failed to fetch numbers' });
        }

        const data = await response.json();
        const numbers = data.numbers || [];

        windowPrevState = [...windowCurrState];

        windowCurrState = [...windowCurrState, ...numbers].slice(-WINDOW_SIZE);

        const windowAverage = windowCurrState.length
            ? windowCurrState.reduce((a, b) => a + b, 0) / windowCurrState.length
            : 0;

        res.json({
            windowPrevState,
            windowCurrState,
            numbers,
            windowAverage
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
