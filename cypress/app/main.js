// create router and store
import { createApp } from '@kirei/element';
import { createRouter } from '@kirei/router';
import { createStore } from '@kirei/store';
import { storagePlugin } from './store/Todo';

// IMPORTANT: Before any elements are imported
const app = createApp('app');

import AppRoot from './views/App';
import View from './views/View';
import Home from './views/Home/Layout';
import HomeView from './views/Home/View';
import HomeNews from './views/Home/News';
import User from './views/User';
import Users from './views/Users';
import Clock from './views/Clock';
import Todo from './views/Todo';

const routes = {
  base: '',
  root: '#app',
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
    { path: '/todo', element: Todo },
  ]
};

const router = createRouter(routes);
const store = createStore({ plugins: [ storagePlugin ] });

app.use(store);
//app.install(router);
