import { ref } from '@kirei/element';

export function useStore() {
  const Count = ref(0);
  const User = ref(null);
  const Token = ref(null);

  return {
    count: Count,
    increment() { Count.value++; },

    user: User,
    token: Token,
    login(user) {
      User.value = user;
      Token.value = crypto.getRandomValues(new Uint8Array(16)).map(x => x.toString(16)).join('');
    }
  };
}
