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

  updateUser(id, user) {
    const userSelect = this.findUser(id);
    if (userSelect) {
      let userUpdate = { ...user, ...userSelect }
      this.saveUser(id, userUpdate);
    }
  }

  findAllUser() {
    return [...this.user.values()];
  }
}


module.exports = UserStore