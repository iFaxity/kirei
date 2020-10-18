// create router
import { createRouter } from '@kirei/router';

import './views/App';
import View from './views/View';
import Home from './views/Home/Layout';
import HomeView from './views/Home/View';
import HomeNews from './views/Home/News';
import User from './views/User';
import Users from './views/Users';
import Clock from './views/Clock';

createRouter({
  base: '',
  root: '#root',
  routes: [
    { path: '/', element: View },
    {
      path: '/home',
      element: Home,
      routes: [
        { path: '/', element: HomeView },
        { path: '/news', element: HomeNews },
      ],
    },
    { path: '/user', element: Users },
    { path: '/user/:user', element: User },
    { path: '/clock', element: Clock },
  ]
});
