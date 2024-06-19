class UserStore {
  constructor() {
    this.user = new Map();
  }

  findUser(id) {
    return this.user.get(id);
  }

  saveUser(id, user) {
    this.user.set(id, user);
  }

  findAllUser() {
    return [...this.user.values()];
  }
}

module.exports = UserStore