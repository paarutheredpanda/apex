import { getAuth, requireAuth as clerkRequireAuth } from '@clerk/express';
import { Request, Response, NextFunction } from 'express';

// Use Clerk's built-in requireAuth middleware
export const requireAuth = clerkRequireAuth();

// Helper to safely get userId (Fixed: safely checks for property presence)
export const getUserId = (req: Request): string | null => {
    try {
const auth = getAuth(req as any);        // Safely check if userId exists on the returned object
        if (auth && 'userId' in auth && auth.userId) {
            return auth.userId;
        }
        return null;
    } catch (error) {
        return null;
    }
};

// Middleware to attach userId to request object 
export const attachUserId = (req: Request, res: Response, next: NextFunction) => {
    const userId = getUserId(req);
    (req as any).userId = userId;        
    next();
};

// Global augmentation: Extends Express Request type safely
declare global {
    namespace Express {
        interface Request {
            userId?: string | null;
        }
    }
}

// Better typed middleware (Fixed: safely reads userId from auth union types)
export const currentUser = (req: Request, res: Response, next: NextFunction) => {
const auth = getAuth(req as any);    
    // Check if auth exists and has a userId before mapping it to req.userId
    if (auth && 'userId' in auth) {
        req.userId = auth.userId ?? null;
    } else {
        req.userId = null;
    }
    
    next();
};

// Export getAuth directly if needed
export { getAuth };