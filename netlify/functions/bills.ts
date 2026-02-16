import { getStore } from '@netlify/blobs';
import type { Context } from '@netlify/functions';

export default async (req: Request, context: Context) => {
    const store = getStore('data');
    const method = req.method;

    // CORS headers
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    };

    // Handle OPTIONS for CORS
    if (method === 'OPTIONS') {
        return new Response(null, { status: 204, headers });
    }

    try {
        // GET - Fetch all bills
        if (method === 'GET') {
            const bills = await store.get('bills', { type: 'json' }) || [];
            return new Response(JSON.stringify(bills), { headers });
        }

        // POST - Add new bill
        if (method === 'POST') {
            const newBill = await req.json();
            const bills = await store.get('bills', { type: 'json' }) || [];
            bills.push(newBill);
            await store.setJSON('bills', bills);
            return new Response(JSON.stringify(newBill), { status: 201, headers });
        }

        // PUT - Update bill
        if (method === 'PUT') {
            const updated = await req.json();
            const bills = await store.get('bills', { type: 'json' }) || [];
            const index = bills.findIndex((b: any) => b.id === updated.id);
            if (index >= 0) {
                bills[index] = updated;
                await store.setJSON('bills', bills);
                return new Response(JSON.stringify(updated), { headers });
            }
            return new Response(JSON.stringify({ error: 'Bill not found' }), { status: 404, headers });
        }

        // DELETE - Remove bill
        if (method === 'DELETE') {
            const { id } = await req.json();
            const bills = await store.get('bills', { type: 'json' }) || [];
            const filtered = bills.filter((b: any) => b.id !== id);
            await store.setJSON('bills', filtered);
            return new Response(null, { status: 204, headers });
        }

        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
    } catch (error: any) {
        console.error('Bills API Error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
    }
};
