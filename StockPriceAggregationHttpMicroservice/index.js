import express from 'express';
import fetch from 'node-fetch';
const app = express();

const BASE_URL = 'http://20.244.56.144/evaluation-service/stocks';
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiZXhwIjoxNzQ4MzI4NzA0LCJpYXQiOjE3NDgzMjg0MDQsImlzcyI6IkFmZm9yZG1lZCIsImp0aSI6Ijc1MmVlYmE2LWEyZWQtNDdlMC1iZTExLTUyZDIwYjVjMmM0MyIsInN1YiI6IjIyMzExYTA1ODBAY3NlLnNyZWVuaWRoaS5lZHUuaW4ifSwiZW1haWwiOiIyMjMxMWEwNTgwQGNzZS5zcmVlbmlkaGkuZWR1LmluIiwibmFtZSI6Im1pcmd1ZGUgc2Fpa3Jpc2huYSIsInJvbGxObyI6IjIyMzExYTA1ODAiLCJhY2Nlc3NDb2RlIjoiUENxQVVLIiwiY2xpZW50SUQiOiI3NTJlZWJhNi1hMmVkLTQ3ZTAtYmUxMS01MmQyMGI1YzJjNDMiLCJjbGllbnRTZWNyZXQiOiJxTUZWeXZQeXdoaEJCYnByIn0.-VV3KlDFE30AjNEvlFCelslMIwjB3EuHWEPn9FcNdCc';

app.get('/stocks/:ticker', async (req, res) => {
    const { ticker } = req.params;
    const { minutes, aggregation } = req.query;
    if (!minutes || aggregation !== 'average') {
        return res.status(400).json({ error: 'Missing or invalid query parameters' });
    }
    try {
        const response = await fetch(`${BASE_URL}/${ticker}?minutes=${minutes}`, {
            headers: { 
                'Authorization': `Bearer ${token}` 
            }
        });
        if (!response.ok) 
            return res.status(response.status).json({ error: 'Stock API error' });
        const data = await response.json();
        const pricesArr = data.prices || data;
        if (!Array.isArray(pricesArr) || pricesArr.length === 0) 
            return res.json({ averageStockPrice: 0,priceHistory: [] });
        
        const prices = pricesArr.map(item => item.price).filter(p => typeof p === 'number');
        if (prices.length === 0) return res.json({ average: 0, prices: [] });
        const average = prices.reduce((a, b) => a + b, 0) / prices.length;
        res.json({averageStockPrice:average, priceHistory: data});
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/stockcorrelation', async (req, res) => {
    const { minutes, ticker } = req.query;
    if (!minutes || !ticker || !Array.isArray(ticker) || ticker.length !== 2) {
        return res.status(400).json({ error: 'Provide two tickers and minutes' });
    }
    const [ticker1, ticker2] = ticker;
    try {
        const [resp1, resp2] = await Promise.all([
            fetch(`${BASE_URL}/${ticker1}?minutes=${minutes}`, { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(`${BASE_URL}/${ticker2}?minutes=${minutes}`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        if (!resp1.ok || !resp2.ok) return res.status(400).json({ error: 'Stock API error' });
        const data1 = await resp1.json();
        const data2 = await resp2.json();
        const arr1 = data1.prices || data1;
        const arr2 = data2.prices || data2;
        const prices1 = arr1.map(item => item.price).filter(p => typeof p === 'number');
        const prices2 = arr2.map(item => item.price).filter(p => typeof p === 'number');
        
        const n = Math.min(prices1.length, prices2.length);
        if (n === 0) return res.status(400).json({ error: 'No overlapping price data' });
        const slice1 = prices1.slice(0, n);
        const slice2 = prices2.slice(0, n);

        
        const avg1 = slice1.reduce((a, b) => a + b, 0) / n;
        const avg2 = slice2.reduce((a, b) => a + b, 0) / n;
        let num = 0, den1 = 0, den2 = 0;
        for (let i = 0; i < n; i++) {
            num += (slice1[i] - avg1) * (slice2[i] - avg2);
            den1 += (slice1[i] - avg1) ** 2;
            den2 += (slice2[i] - avg2) ** 2;
        }
        const correlation = den1 && den2 ? num/ Math.sqrt(den1 * den2) : 0;
        res.json({ correlation:correlation,stocks:{[ticker1]:{averagePrice:avg1,priceHistory:arr1}, [ticker2]:{averagePrice:avg2,priceHistory:arr2 }}});
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(3000, () => 
    console.log('Server running on port 3000')
);