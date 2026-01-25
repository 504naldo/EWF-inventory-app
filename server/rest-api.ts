import { Router } from 'express';
import { appRouter } from './routers';
import { sdk } from './_core/sdk';
import type { Request, Response } from 'express';

export const restApiRouter = Router();

// Helper to create tRPC caller from request
async function createCaller(req: Request, res: Response) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(req);
  } catch (error) {
    // Authentication is optional for public procedures
    user = null;
  }
  
  return appRouter.createCaller({ req, res, user });
}

// POST /api/auth/login
restApiRouter.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // For now, return mock response since Manus OAuth doesn't support email/password
    // In production, implement your own email/password auth or use the existing OAuth
    return res.status(501).json({ 
      error: 'Email/password login not implemented. Use Manus OAuth instead.',
      message: 'This endpoint needs to be implemented with your auth system'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/logout
restApiRouter.post('/auth/logout', async (req, res) => {
  try {
    const caller = await createCaller(req, res);
    await caller.auth.logout();
    res.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/inventory
restApiRouter.get('/inventory', async (req, res) => {
  try {
    const caller = await createCaller(req, res);
    const { category, q } = req.query;
    
    let items;
    if (category) {
      items = await caller.inventory.listByCategory({ category: category as string });
    } else if (q) {
      items = await caller.inventory.search({ query: q as string });
    } else {
      items = await caller.inventory.list();
    }
    
    // Transform to match mobile app expected format
    const transformed = items.map(item => ({
      id: item.id,
      productCode: item.productCode,
      description: item.productDescription,
      quantity: item.quantity,
      cost: item.currentCost,
      category: item.category,
      updatedAt: item.updatedAt,
    }));
    
    res.json(transformed);
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/inventory/:id
restApiRouter.get('/inventory/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Since there's no get procedure, fetch all and filter
    const caller = await createCaller(req, res);
    const items = await caller.inventory.list();
    const item = items.find(i => i.id === id);
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    // Transform to match mobile app expected format
    const transformed = {
      id: item.id,
      productCode: item.productCode,
      description: item.productDescription,
      quantity: item.quantity,
      cost: item.currentCost,
      category: item.category,
      updatedAt: item.updatedAt,
    };
    
    res.json(transformed);
  } catch (error) {
    console.error('Get inventory item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/inventory
restApiRouter.post('/inventory', async (req, res) => {
  try {
    const caller = await createCaller(req, res);
    const { productCode, description, quantity, cost, category } = req.body;
    
    if (!productCode || !description || !category) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    await caller.inventory.create({
      productCode,
      productDescription: description,
      quantity: quantity || 0,
      currentCost: cost || 0,
      category,
    });
    
    res.status(201).json({ success: true });
  } catch (error) {
    console.error('Create inventory item error:', error);
    const message = (error as Error).message;
    if (message.includes('FORBIDDEN')) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/inventory/:id
restApiRouter.patch('/inventory/:id', async (req, res) => {
  try {
    const caller = await createCaller(req, res);
    const { id } = req.params;
    const { productCode, description, quantity, cost, category } = req.body;
    
    await caller.inventory.update({
      id,
      productCode,
      productDescription: description,
      quantity,
      currentCost: cost,
      category,
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Update inventory item error:', error);
    const message = (error as Error).message;
    if (message.includes('FORBIDDEN')) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});
