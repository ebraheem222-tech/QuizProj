export class StorageService {
  constructor(prefix = "quizproj") {
    this.prefix = prefix;
  }

  key(name) {
    return `${this.prefix}.${name}`;
  }

  get(name, fallback = null) {
    const value = localStorage.getItem(this.key(name));

    if (!value) {
      return fallback;
    }

    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }

  set(name, value) {
    localStorage.setItem(this.key(name), JSON.stringify(value));
  }

  remove(name) {
    localStorage.removeItem(this.key(name));
  }
}
