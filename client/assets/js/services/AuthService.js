import { User } from "../models/User.js";
import { StorageService } from "./StorageService.js";

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

export class AuthService {
  constructor(storage = new StorageService()) {
    this.storage = storage;
    this.usersKey = "users";
    this.currentUserKey = "currentUserId";
  }

  getUsers() {
    return this.storage.get(this.usersKey, []).map(user => User.from(user));
  }

  saveUsers(users) {
    this.storage.set(this.usersKey, users);
  }

  getUserById(userId) {
    return this.getUsers().find(user => user.id === userId) || null;
  }

  getCurrentUser() {
    const currentUserId = this.storage.get(this.currentUserKey, null);
    return currentUserId ? this.getUserById(currentUserId) : null;
  }

  register(userData) {
    const users = this.getUsers();
    const fullName = String(userData.fullName || "").trim();
    const normalizedEmail = normalizeEmail(userData.email);
    const nationalId = String(userData.nationalId || "").trim();
    const password = String(userData.password || "");

    if (!["teacher", "student"].includes(userData.role)) {
      throw new Error("יש לבחור מורה או סטודנט.");
    }

    if (!fullName || !normalizedEmail || !nationalId || !password) {
      throw new Error("יש למלא את כל פרטי ההרשמה.");
    }

    if (users.some(user => normalizeEmail(user.email) === normalizedEmail)) {
      throw new Error("האימייל כבר קיים במערכת.");
    }

    if (users.some(user => String(user.nationalId || "").trim() === nationalId)) {
      throw new Error("תעודת הזהות כבר קיימת במערכת.");
    }

    const user = new User({
      fullName,
      nationalId,
      email: normalizedEmail,
      password,
      role: userData.role
    });

    this.saveUsers([...users, user]);
    this.storage.set(this.currentUserKey, user.id);
    return user;
  }

  login(identifier, password) {
    const normalizedIdentifier = normalizeEmail(identifier);
    const user = this.getUsers().find(existingUser => (
      normalizeEmail(existingUser.email) === normalizedIdentifier ||
      String(existingUser.nationalId || "").trim() === String(identifier || "").trim()
    ));

    if (!user || user.password !== password) {
      throw new Error("פרטי ההתחברות שגויים.");
    }

    this.storage.set(this.currentUserKey, user.id);
    return user;
  }

  logout() {
    this.storage.remove(this.currentUserKey);
  }
}
