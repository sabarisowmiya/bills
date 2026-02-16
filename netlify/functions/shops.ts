import { getStore } from '@netlify/blobs';
import type { Context } from '@netlify/functions';

export default async (req: Request, context: Context) => {
    const store = getStore('data');
    const method = req.method;

    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    };

    if (method === 'OPTIONS') {
        return new Response(null, { status: 204, headers });
    }

    try {
        // GET - Fetch all shops
        if (method === 'GET') {
            const shops = await store.get('shops', { type: 'json' }) || [];
            return new Response(JSON.stringify(shops), { headers });
        }

        // POST - Add new shop
        if (method === 'POST') {
            const newShop = await req.json();
            const shops = await store.get('shops', { type: 'json' }) || [];
            shops.push(newShop);
            await store.setJSON('shops', shops);
            return new Response(JSON.stringify(newShop), { status: 201, headers });
        }

        // PUT - Update shop
        if (method === 'PUT') {
            const updated = await req.json();
            const shops = await store.get('shops', { type: 'json' }) || [];
            const index = shops.findIndex((s: any) => s.id === updated.id);
            if (index >= 0) {
                shops[index] = updated;
                await store.setJSON('shops', shops);
                return new Response(JSON.stringify(updated), { headers });
            }
            return new Response(JSON.stringify({ error: 'Shop not found' }), { status: 404, headers });
        }

        // DELETE - Remove shop
        if (method === 'DELETE') {
            const { id } = await req.json();
            const shops = await store.get('shops', { type: 'json' }) || [];
            const filtered = shops.filter((s: any) => s.id !== id);
            await store.setJSON('shops', filtered);
            return new Response(null, { status: 204, headers });
        }

        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
    } catch (error: any) {
        console.error('Shops API Error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
    }
};
