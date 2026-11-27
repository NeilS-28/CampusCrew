import { defineAuth, defineFunction } from '@aws-amplify/backend';

const preSignUp = defineFunction({
  entry: './pre-sign-up/handler.ts',
});

export const auth = defineAuth({
  loginWith: { email: true },
  triggers: { preSignUp },
});
