import { ApolloServer } from '@apollo/server';
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { Pool } from 'pg';

// Koneksi ke Neon. Pakai connection string POOLED (-pooler) dari env.
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

const typeDefs = `#graphql
  type Kategori {
    id: ID!
    nama: String!
    produk: [Produk!]!
  }
  type Produk {
    id: ID!
    nama: String!
    harga: Int!
    stok: Int!
    kategori: Kategori
  }
  type Query {
    kategori: [Kategori!]!
    produk: [Produk!]!
    satuProduk(id: ID!): Produk
  }
`;

const resolvers = {
    Query: {
        kategori: async () => (await pool.query('SELECT * FROM kategori ORDER BY id')).rows,
        produk: async () => (await pool.query('SELECT * FROM produk ORDER BY id')).rows,
        satuProduk: async (_, { id }) =>
            (await pool.query('SELECT * FROM produk WHERE id = $1', [id])).rows[0],
    },
    // Resolver relasi: produk -> kategori induknya
    Produk: {
        kategori: async (parent) =>
            (await pool.query('SELECT * FROM kategori WHERE id = $1', [parent.kategori_id])).rows[0],
    },
    // Resolver relasi: kategori -> daftar produk di dalamnya
    Kategori: {
        produk: async (parent) =>
            (await pool.query('SELECT * FROM produk WHERE kategori_id = $1', [parent.id])).rows,
    },
};

const server = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: true, // WAJIB on agar Apollo Sandbox dosen bisa membaca schema
});

const graphqlHandler = startServerAndCreateNextHandler(server);

// Bungkus dengan header CORS agar studio.apollographql.com boleh mengakses
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', 'https://studio.apollographql.com');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, apollo-require-preflight');
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    return graphqlHandler(req, res);
}