// Test-only accounts and data. These exist only in the throwaway PGlite database.

export const USERS = {
  admin: {
    email: "admin@test.local",
    name: "Test Admin",
    role: "ADMIN",
    password: "Admin-Test-Pass-1",
  },
  editor: {
    email: "editor@test.local",
    name: "Test Editor",
    role: "EDITOR",
    password: "Editor-Test-Pass-1",
  },
  lock: {
    email: "lock@test.local",
    name: "Lock Test",
    role: "EDITOR",
    password: "Lock-Test-Pass-1",
  },
};

export const FIXTURE_PROJECT = {
  slug: "sample-residential-tower",
  title: "Sample Residential Tower",
  clientName: "Sample Developer",
  city: "Mumbai",
  year: 2024,
  description: "QA fixture project (test data only).",
};
