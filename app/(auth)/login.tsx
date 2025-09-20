import React, { useEffect } from 'react';
import SplashScreen from '@/app/splash';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginRedirect() {
  const { loading } = useAuth();

  // Just show splash while checking auth state; splash handles redirect
  return <SplashScreen />;
}