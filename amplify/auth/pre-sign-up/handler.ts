import type { PreSignUpTriggerHandler } from 'aws-lambda';

export const handler: PreSignUpTriggerHandler = async (event) => {
  const email = event.request.userAttributes.email?.toLowerCase() || '';
  if (!email.endsWith('.ac.in') && !email.endsWith('.edu')) {
    throw new Error('Only official college emails (.ac.in or .edu) are allowed.');
  }
  return event;
};
