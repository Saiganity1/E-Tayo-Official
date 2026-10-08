// Shared server-side store for registered accounts and secure OTP verification
import { getAssignedUserByEmail, getAssignedUsers } from "./staffStore";

export interface RegisteredUser {
  id: number;
  name: string;
  email: string;
  password?: string;
  role: string;
  createdAt: string;
}

export interface StoredOtp {
  otp: string;
  expiresAt: number;
  createdAt: number;
}

const globalForAuth = globalThis as unknown as {
  _registeredUsers: RegisteredUser[];
  _otpStore: Record<string, StoredOtp>;
};

if (!globalForAuth._registeredUsers) {
  globalForAuth._registeredUsers = [
    {
      id: 1,
      name: "Municipal Administrator",
      email: "admin@etayo.gov.ph",
      password: "admin123",
      role: "ROLE_ADMIN",
      createdAt: "2026-08-01T09:00:00Z"
    },
    {
      id: 2,
      name: "Dave Sicat",
      email: "dave.sicat@etayo.gov.ph",
      password: "password123",
      role: "ROLE_STAFF",
      createdAt: "2026-09-01T08:00:00Z"
    },
    {
      id: 3,
      name: "Juan Verifier",
      email: "juan.verifier@etayo.gov.ph",
      password: "password123",
      role: "ROLE_STAFF",
      createdAt: "2026-09-01T08:00:00Z"
    },
    {
      id: 4,
      name: "Engr. Gilbert Cruz",
      email: "gilbert.cruz@etayo.gov.ph",
      password: "password123",
      role: "ROLE_STAFF",
      createdAt: "2026-09-01T08:00:00Z"
    },
    {
      id: 5,
      name: "RANDREB YUTUC DAVID",
      email: "randreb.david@example.com",
      password: "password123",
      role: "ROLE_APPLICANT",
      createdAt: "2026-10-08T10:00:00Z"
    },
    {
      id: 6,
      name: "Kathleen Ann Abarquez",
      email: "kathleen.abarquez@example.com",
      password: "password123",
      role: "ROLE_APPLICANT",
      createdAt: "2026-10-08T10:00:00Z"
    },
    {
      id: 7,
      name: "Maria Santos",
      email: "maria.santos@example.com",
      password: "password123",
      role: "ROLE_APPLICANT",
      createdAt: "2026-10-08T10:00:00Z"
    }
  ];
}

if (!globalForAuth._otpStore) {
  globalForAuth._otpStore = {};
}

/**
 * Generate a 6-digit numeric OTP and store it with 10-minute expiry
 */
export function generateOtp(email: string): string {
  const cleanEmail = String(email || "").trim().toLowerCase();
  // 6-digit number between 100000 and 999999
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const now = Date.now();
  const expiresAt = now + 10 * 60 * 1000; // 10 minutes

  globalForAuth._otpStore[cleanEmail] = {
    otp,
    expiresAt,
    createdAt: now
  };

  console.info(`[eTAYO OTP Generator] New OTP for ${cleanEmail}: ${otp} (expires in 10 minutes)`);
  return otp;
}

/**
 * Get stored OTP record for an email
 */
export function getStoredOtp(email: string): StoredOtp | undefined {
  const cleanEmail = String(email || "").trim().toLowerCase();
  return globalForAuth._otpStore[cleanEmail];
}

/**
 * Verify OTP entered by user. Consumes the OTP if valid.
 */
export function verifyAndConsumeOtp(email: string, enteredOtp: string): { valid: boolean; error?: string } {
  const cleanEmail = String(email || "").trim().toLowerCase();
  const cleanEnteredOtp = String(enteredOtp || "").trim();

  const record = globalForAuth._otpStore[cleanEmail];
  if (!record) {
    return { valid: false, error: "No OTP was requested for this email. Please request an OTP first." };
  }

  if (Date.now() > record.expiresAt) {
    delete globalForAuth._otpStore[cleanEmail];
    return { valid: false, error: "Verification code has expired. Please request a new OTP." };
  }

  if (record.otp !== cleanEnteredOtp) {
    return { valid: false, error: "Invalid verification code. Please check and try again." };
  }

  // Single-use: delete after successful verification
  delete globalForAuth._otpStore[cleanEmail];
  return { valid: true };
}

/**
 * Check if an email is registered in system (seed users, staff, or registered accounts)
 */
export function findRegisteredUser(email: string): RegisteredUser | undefined {
  const cleanEmail = String(email || "").trim().toLowerCase();
  
  // 1. Check in registered users store
  const found = globalForAuth._registeredUsers.find(u => u.email.toLowerCase() === cleanEmail);
  if (found) return found;

  // 2. Check in staff store
  const staff = getAssignedUserByEmail(cleanEmail);
  if (staff) {
    return {
      id: staff.id,
      name: staff.name,
      email: staff.email,
      role: staff.role,
      createdAt: staff.createdAt,
      password: (staff as any).password || "password123"
    };
  }

  // 3. Admin alias check
  if (cleanEmail === "admin" || cleanEmail.includes("admin@")) {
    return {
      id: 999,
      name: "Municipal Administrator",
      email: "admin@etayo.gov.ph",
      password: "admin123",
      role: "ROLE_ADMIN",
      createdAt: "2026-08-01T09:00:00Z"
    };
  }

  return undefined;
}

/**
 * Register a new user in the system store
 */
export function registerUser(name: string, email: string, password?: string, role: string = "ROLE_APPLICANT"): RegisteredUser {
  const cleanEmail = String(email || "").trim().toLowerCase();
  const cleanName = String(name || "").trim();
  const cleanPassword = String(password || "").trim();

  const existingIdx = globalForAuth._registeredUsers.findIndex(u => u.email.toLowerCase() === cleanEmail);
  if (existingIdx >= 0) {
    globalForAuth._registeredUsers[existingIdx] = {
      ...globalForAuth._registeredUsers[existingIdx],
      name: cleanName,
      password: cleanPassword || globalForAuth._registeredUsers[existingIdx].password,
      role
    };
    return globalForAuth._registeredUsers[existingIdx];
  }

  const newUser: RegisteredUser = {
    id: Date.now(),
    name: cleanName,
    email: cleanEmail,
    password: cleanPassword,
    role,
    createdAt: new Date().toISOString()
  };

  globalForAuth._registeredUsers.push(newUser);
  return newUser;
}

/**
 * Check whether email is registered
 */
export function isUserRegistered(email: string): boolean {
  return Boolean(findRegisteredUser(email));
}
