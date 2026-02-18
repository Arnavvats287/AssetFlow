import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key_12345";

// Middleware to verify token
const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: "Unauthorized: No token provided" });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ message: "Forbidden: Invalid token" });
    (req as any).user = user;
    next();
  });
};

const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  if (!user || user.role !== 'ADMIN') {
    return res.status(403).json({ message: "Forbidden: Admin access required" });
  }
  next();
};

const requireUser = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  if (!user || user.role !== 'USER') {
    return res.status(403).json({ message: "Forbidden: User access required" });
  }
  next();
};

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Auth Routes
  app.post(api.auth.login.path, async (req, res) => {
    try {
      const { email, password } = api.auth.login.input.parse(req.body);
      const user = await storage.getUserByEmail(email);

      if (!user || !(await bcrypt.compare(password, user.password)) || user.status !== 'ACTIVE') {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
      res.json({ token, user });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.auth.me.path, authenticateToken, async (req, res) => {
    const userId = (req as any).user.id;
    const user = await storage.getUser(userId);
    if (!user) return res.sendStatus(404);
    res.json(user);
  });

  // Admin Routes
  app.get(api.admin.users.list.path, authenticateToken, requireAdmin, async (req, res) => {
    const users = await storage.listUsers();
    res.json(users);
  });

  app.post(api.admin.users.create.path, authenticateToken, requireAdmin, async (req, res) => {
    try {
      const input = api.admin.users.create.input.parse(req.body);
      const hashedPassword = await bcrypt.hash(input.password, 10);
      const user = await storage.createUser({ ...input, password: hashedPassword });
      res.status(201).json(user);
    } catch (err) {
      res.status(400).json({ message: "Error creating user" });
    }
  });

  app.put(api.admin.users.update.path, authenticateToken, requireAdmin, async (req, res) => {
    try {
      const input = api.admin.users.update.input.parse(req.body);
      if (input.password) {
        input.password = await bcrypt.hash(input.password, 10);
      }
      const user = await storage.updateUser(req.params.id, input);
      res.json(user);
    } catch (err) {
      res.status(400).json({ message: "Error updating user" });
    }
  });

  app.patch(api.admin.users.deactivate.path, authenticateToken, requireAdmin, async (req, res) => {
    const user = await storage.deactivateUser(req.params.id);
    res.json(user);
  });

  app.post(api.admin.assets.create.path, authenticateToken, requireAdmin, async (req, res) => {
    try {
      const input = api.admin.assets.create.input.parse(req.body);
      const asset = await storage.createAsset(input);
      res.status(201).json(asset);
    } catch (err) {
      res.status(400).json({ message: "Error creating asset" });
    }
  });

  app.put(api.admin.assets.update.path, authenticateToken, requireAdmin, async (req, res) => {
    try {
      const input = api.admin.assets.update.input.parse(req.body);
      const asset = await storage.updateAsset(req.params.id, input);
      res.json(asset);
    } catch (err) {
      res.status(400).json({ message: "Error updating asset" });
    }
  });

  app.delete(api.admin.assets.delete.path, authenticateToken, requireAdmin, async (req, res) => {
    await storage.deleteAsset(req.params.id);
    res.status(204).send();
  });

  app.post(api.admin.assignments.assign.path, authenticateToken, requireAdmin, async (req, res) => {
    try {
      const input = api.admin.assignments.assign.input.parse(req.body);
      const asset = await storage.getAsset(input.assetId);
      if (!asset || asset.status !== 'AVAILABLE') {
        return res.status(400).json({ message: "Asset is not available" });
      }
      const assignment = await storage.assignAsset(input);
      res.status(201).json(assignment);
    } catch (err) {
      res.status(400).json({ message: "Error assigning asset" });
    }
  });

  app.get(api.admin.assignments.history.path, authenticateToken, requireAdmin, async (req, res) => {
    const assignments = await storage.listAssignments();
    res.json(assignments);
  });

  app.post(api.admin.assignments.return.path, authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { assetId } = api.admin.assignments.return.input.parse(req.body);
      const assignment = await storage.returnAsset(assetId);
      if (!assignment) {
        return res.status(404).json({ message: "No active assignment found" });
      }
      res.json(assignment);
    } catch (err) {
      res.status(400).json({ message: "Error returning asset" });
    }
  });

  app.get(api.admin.dashboard.stats.path, authenticateToken, requireAdmin, async (req, res) => {
    const stats = await storage.getStats();
    res.json(stats);
  });

  app.get(api.admin.reports.assets.path, authenticateToken, requireAdmin, async (req, res) => {
    const assets = await storage.listAssets();
    const csv = "ID,Name,Category,Status\n" + assets.map(a => `${a.assetId},${a.name},${a.category},${a.status}`).join("\n");
    res.setHeader('Content-Type', 'text/csv').send(csv);
  });

  app.get(api.admin.reports.assignments.path, authenticateToken, requireAdmin, async (req, res) => {
    const assignments = await storage.listAssignments();
    const csv = "Asset,User,Status\n" + assignments.map(a => `${a.asset.name},${a.user.name},${a.status}`).join("\n");
    res.setHeader('Content-Type', 'text/csv').send(csv);
  });

  // User Routes
  app.get(api.user.assets.list.path, authenticateToken, requireUser, async (req, res) => {
    const userId = (req as any).user.id;
    const assets = await storage.listMyAssets(userId);
    res.json(assets);
  });

  app.post(api.user.assets.requestReturn.path, authenticateToken, requireUser, async (req, res) => {
    try {
      const { assetId } = api.user.assets.requestReturn.input.parse(req.body);
      const userId = (req as any).user.id;
      const assignment = await storage.requestReturn(assetId, userId);
      if (!assignment) return res.status(404).json({ message: "Assignment not found" });
      res.json(assignment);
    } catch (err) {
      res.status(400).json({ message: "Error requesting return" });
    }
  });

  // Global Assets List (Optional, but useful for selection)
  app.get(api.assets.list.path, authenticateToken, async (req, res) => {
    const assets = await storage.listAssets();
    res.json(assets);
  });

  await seedDatabase();
  return httpServer;
}

async function seedDatabase() {
  const usersList = await storage.listUsers();
  if (usersList.length === 0) {
    const adminPassword = await bcrypt.hash("Admin@123", 10);
    await storage.createUser({
      name: "System Admin",
      email: "admin@company.com",
      password: adminPassword,
      role: "ADMIN",
      status: "ACTIVE"
    });

    const userPassword = await bcrypt.hash("User@123", 10);
    for (let i = 1; i <= 5; i++) {
      await storage.createUser({
        name: `User ${i}`,
        email: `user${i}@company.com`,
        password: userPassword,
        role: "USER",
        status: "ACTIVE"
      });
    }

    const categories = ["Laptop", "Monitor", "Keyboard"];
    for (let i = 1; i <= 15; i++) {
      await storage.createAsset({
        assetId: `AST-${String(i).padStart(3, '0')}`,
        name: `${categories[i % 3]} ${i}`,
        category: categories[i % 3],
        serialNumber: `SN-${Math.random().toString(36).substring(7).toUpperCase()}`,
        purchaseDate: new Date().toISOString().split('T')[0],
        status: "AVAILABLE" 
      });
    }
  }
}
