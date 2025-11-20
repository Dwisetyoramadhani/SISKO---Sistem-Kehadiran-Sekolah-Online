(function(){
  window.Auth = {
    users: AuthStorage.getUsers,
    addUser: AuthStorage.createUser,
    login: AuthStorage.login,
    logout: AuthStorage.logout,
    session: AuthStorage.current,
    isAdmin: AuthStorage.isAdmin,
    isKelas: AuthStorage.isKelas
  };
})();