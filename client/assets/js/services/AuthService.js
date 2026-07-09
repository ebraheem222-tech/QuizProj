import { User } from "../models/User.js";
import { StorageService } from "./StorageService.js";

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
    const normalizedEmail = userData.email.trim().toLowerCase();
    const nationalId = userData.nationalId.trim();

    if (!["teacher", "student"].includes(userData.role)) {
      throw new Error("יש לבחור מורה או סטודנט.");
    }

    if (users.some(user => user.email.toLowerCase() === normalizedEmail)) {
      throw new Error("האימייל כבר קיים במערכת.");
    }

    if (users.some(user => user.nationalId === nationalId)) {
      throw new Error("תעודת הזהות כבר קיימת במערכת.");
    }

    const user = new User({
      fullName: userData.fullName.trim(),
      nationalId,
      email: normalizedEmail,
      password: userData.password,
      role: userData.role
    });

    this.saveUsers([...users, user]);
    this.storage.set(this.currentUserKey, user.id);
    return user;
  }

  login(identifier, password) {
    const normalizedIdentifier = identifier.trim().toLowerCase();
    const user = this.getUsers().find(existingUser => (
      existingUser.email.toLowerCase() === normalizedIdentifier ||
      existingUser.nationalId === identifier.trim()
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
