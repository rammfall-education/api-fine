export const ROUTE_PREFIX = '/api';

export const Routes = {
  login: '/login',
  register: '/register',
};

export const NotProtectedRoutes = {
  login: {
    unprefixed: Routes.login,
    get prefixed() {
      return `${ROUTE_PREFIX}${this.unprefixed}`;
    },
  },
  register: {
    unprefixed: Routes.register,
    get prefixed() {
      return `${ROUTE_PREFIX}${this.unprefixed}`;
    },
  },
};

export const NotProtectedRoutesList = Object.values(NotProtectedRoutes).map(
  ({ prefixed }) => prefixed
);
