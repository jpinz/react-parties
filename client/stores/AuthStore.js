import AppDispatcher from '../dispatcher/AppDispatcher';
import AuthConstants from '../constants/AuthConstants';
import { EventEmitter } from 'events';
import jwt_decode from 'jwt-decode';

import permissions from '../../common/permission'

const CHANGE_EVENT = 'change';

function setUser(profile, token) {
  if (!localStorage.getItem('id_token')) {
    localStorage.setItem('profile', JSON.stringify(profile));
    localStorage.setItem('id_token', token);
  }
}

function removeUser() {
  localStorage.removeItem('profile');
  localStorage.removeItem('id_token');
}

class AuthStoreClass extends EventEmitter {
  emitChange() {
    this.emit(CHANGE_EVENT);
  }

  addChangeListener(callback) {
    this.on(CHANGE_EVENT, callback)
  }

  removeChangeListener(callback) {
    this.removeListener(CHANGE_EVENT, callback)
  }

  isAuthenticated() {
    let token = localStorage.getItem('id_token');
    if (token) {
      let user = jwt_decode(token);
      if(!user) return false;
      if(user.exp > (Math.floor(Date.now() / 1000))) {
        return true;
      } else {
        removeUser();
        return false;
      }
    }
    return false;
  }

  getName() {
    let profile = localStorage.getItem('profile');

    if(!profile){
      return undefined;
    } else {
      profile = JSON.parse(profile);
      if(profile.user_metadata && profile.user_metadata.name) {
        return profile.user_metadata.name;
      } else {
        return profile.nickname;
      }
    }
  }

  getUser() {
    return localStorage.getItem('profile');
  }

  isUser() {
    if (this.isAuthenticated()) {
      let user = localStorage.getItem('profile');
      user = JSON.parse(user);
      if(user && user.app_metadata && user.app_metadata.roles) {
        let roles = user.app_metadata.roles;
        let len = roles.length;
        for(var i = 0; i < len; i++){
          if(roles[i]=='party-user' || roles[i]=='admin'){
            return true;
          }
        }
      }
      return false;
    }
    return false;
  }

  hasPermission(perm) {
    let user = localStorage.getItem('profile');
    user = JSON.parse(user);
    return permissions.hasPermission(perm, user.app_metadata.roles || []);
  }

  isAdmin() {
    if (this.isAuthenticated()) {
      let user = localStorage.getItem('profile');
      user = JSON.parse(user);
      if(user && user.app_metadata && user.app_metadata.roles) {
        let roles = user.app_metadata.roles;
        let len = roles.length;
        for(var i = 0; i < len; i++){
          if(roles[i]=='admin'){
            return true;
          }
        }
      }
      return false;
    }
    return false;
  }

  isSocial() {
    if (this.isAuthenticated()) {
      let user = localStorage.getItem('profile');
      user = JSON.parse(user);
      if(user && user.app_metadata && user.app_metadata.roles) {
        let roles = user.app_metadata.roles;
        let len = roles.length;
        for(var i = 0; i < len; i++){
          if(roles[i]=='social' || roles[i]=='admin'){
            return true;
          }
        }
      }
      return false;
    }
    return false;
  }

  getPermissions() {
    return permissions.PERMISSIONS;
  }

  getJwt() {
    return localStorage.getItem('id_token');
  }
}

const AuthStore = new AuthStoreClass();

// Here we register a callback for the dispatcher
// and look for our various action types so we can
// respond appropriately
AuthStore.dispatchToken = AppDispatcher.register(action => {

  switch(action.actionType) {

    case AuthConstants.LOGIN_USER:
      setUser(action.profile, action.token);
      AuthStore.emitChange();
      break

    case AuthConstants.LOGOUT_USER:
      removeUser();
      AuthStore.emitChange();
      break

    default:
  }

});
export default AuthStore;
