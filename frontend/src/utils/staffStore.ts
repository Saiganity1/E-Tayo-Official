// Shared in-memory store for users and staff assignments
// Default contains ZERO staff accounts. Staff must be explicitly assigned by the Admin.

export interface AssignedUser {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

const globalForUsers = globalThis as unknown as {
  _assignedUsersStore: AssignedUser[];
};

if (!globalForUsers._assignedUsersStore) {
  globalForUsers._assignedUsersStore = [
    {
      id: 1,
      name: "Municipal Administrator",
      email: "admin@etayo.gov.ph",
      role: "ROLE_ADMIN",
      createdAt: "2026-08-01T09:00:00Z"
    },
    {
      id: 2,
      name: "Dave Sicat",
      email: "dave.sicat@etayo.gov.ph",
      role: "ROLE_STAFF",
      createdAt: "2026-09-01T08:00:00Z"
    },
    {
      id: 3,
      name: "Juan Verifier",
      email: "juan.verifier@etayo.gov.ph",
      role: "ROLE_STAFF",
      createdAt: "2026-09-01T08:00:00Z"
    },
    {
      id: 4,
      name: "Engr. Gilbert Cruz",
      email: "gilbert.cruz@etayo.gov.ph",
      role: "ROLE_STAFF",
      createdAt: "2026-09-01T08:00:00Z"
    },
    {
      id: 5,
      name: "RANDREB YUTUC DAVID",
      email: "randreb.david@example.com",
      role: "ROLE_APPLICANT",
      createdAt: "2026-10-08T10:00:00Z"
    },
    {
      id: 6,
      name: "Kathleen Ann Abarquez",
      email: "kathleen.abarquez@example.com",
      role: "ROLE_APPLICANT",
      createdAt: "2026-10-08T10:00:00Z"
    },
    {
      id: 7,
      name: "Maria Santos",
      email: "maria.santos@example.com",
      role: "ROLE_APPLICANT",
      createdAt: "2026-10-08T10:00:00Z"
    }
  ];
}

export const isAutomaticDummyStaff = (u: any): boolean => {
  const email = String(u?.email || "").toLowerCase().trim();
  return email === "staff@etayo.gov.ph" || email === "dummy@example.com";
};

export function getAssignedUsers(roleFilter?: string | null): AssignedUser[] {
  let list = globalForUsers._assignedUsersStore.filter(u => !isAutomaticDummyStaff(u));
  if (roleFilter) {
    list = list.filter(u => u.role === roleFilter);
  }
  return list;
}

export function getAssignedUserByEmail(email: string): AssignedUser | undefined {
  const clean = String(email || "").trim().toLowerCase();
  return globalForUsers._assignedUsersStore.find(u => u.email.toLowerCase() === clean);
}

export function addOrUpdateAssignedUser(user: Partial<AssignedUser> & { email: string; name: string }): AssignedUser {
  const cleanEmail = user.email.trim().toLowerCase();
  const cleanName = user.name.trim();
  const cleanRole = user.role || "ROLE_APPLICANT";

  const existingIdx = globalForUsers._assignedUsersStore.findIndex(u => u.email.toLowerCase() === cleanEmail);
  if (existingIdx >= 0) {
    globalForUsers._assignedUsersStore[existingIdx] = {
      ...globalForUsers._assignedUsersStore[existingIdx],
      name: cleanName,
      role: cleanRole
    };
    return globalForUsers._assignedUsersStore[existingIdx];
  } else {
    const newUser: AssignedUser = {
      id: user.id || Date.now(),
      name: cleanName,
      email: cleanEmail,
      role: cleanRole,
      createdAt: user.createdAt || new Date().toISOString()
    };
    globalForUsers._assignedUsersStore.push(newUser);
    return newUser;
  }
}

export function updateUserRole(id: number | string, newRole: string): void {
  const numId = Number(id);
  const user = globalForUsers._assignedUsersStore.find(u => u.id === numId || String(u.id) === String(id));
  if (user) {
    user.role = newRole;
  }
}
