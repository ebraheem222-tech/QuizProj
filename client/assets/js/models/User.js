export class User {
  constructor({
    id = crypto.randomUUID(),
    fullName,
    nationalId,
    email,
    password,
    role,
    createdAt = new Date().toISOString()
  }) {
    this.id = id;
    this.fullName = fullName;
    this.nationalId = nationalId;
    this.email = email;
    this.password = password;
    this.role = role;
    this.createdAt = createdAt;
  }

  static from(data) {
    return new User(data);
  }

  isTeacher() {
    return this.role === "teacher";
  }

  isStudent() {
    return this.role === "student";
  }

  getDashboardRoute() {
    return this.isTeacher() ? "teacher" : "student";
  }
}
