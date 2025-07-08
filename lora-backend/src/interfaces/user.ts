// src/interfaces/User.ts (New file, or adjust existing models/User.ts to be this interface)
// If you had a User.ts class, delete it and use this interface.
export interface User {
  id: number;
  username: string;
  password: string; // Hashed password
  isAdmin: boolean;
}
