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
        // GET - Fetch all products
        if (method === 'GET') {
            const products = await store.get('products', { type: 'json' }) || [];
            return new Response(JSON.stringify(products), { headers });
        }

        // POST - Add new product
        if (method === 'POST') {
            const newProduct = await req.json();
            const products = await store.get('products', { type: 'json' }) || [];
            products.push(newProduct);
            await store.setJSON('products', products);
            return new Response(JSON.stringify(newProduct), { status: 201, headers });
        }

        // PUT - Update product
        if (method === 'PUT') {
            const updated = await req.json();
            const products = await store.get('products', { type: 'json' }) || [];
            const index = products.findIndex((p: any) => p.id === updated.id);
            if (index >= 0) {
                products[index] = updated;
                await store.setJSON('products', products);
                return new Response(JSON.stringify(updated), { headers });
            }
            return new Response(JSON.stringify({ error: 'Product not found' }), { status: 404, headers });
        }

        // DELETE - Remove product
        if (method === 'DELETE') {
            const { id } = await req.json();
            const products = await store.get('products', { type: 'json' }) || [];
            const filtered = products.filter((p: any) => p.id !== id);
            await store.setJSON('products', filtered);
            return new Response(null, { status: 204, headers });
        }

        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
    } catch (error: any) {
        console.error('Products API Error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
    }
};
