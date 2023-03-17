export const ROUTE_PREFIX = '/api';

export const Routes = {
  login: '/login',
  register: '/register',
  accountEmail: '/account/email',
  accountPassword: '/account/password',
  users: '/users',
  fines: '/fines',
  discard: '/discard/:id',
  status: '/status/:id',
  balance: '/balance',
  topUp: '/balance/top-up',
  fine: '/fine',
  specificFine: '/pay/fine/:id',
  adminFines: '/admin/fines',
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
