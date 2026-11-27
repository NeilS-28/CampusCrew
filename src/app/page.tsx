'use client';

import { Authenticator } from '@aws-amplify/ui-react';
import '@/lib/amplify'; // Initialize Amplify configuration
import CampusBoard from '@/components/CampusBoard';

export default function HomePage() {
  return (
    <Authenticator>
      {({ signOut, user }) => <CampusBoard signOut={signOut} user={user} />}
    </Authenticator>
  );
}
