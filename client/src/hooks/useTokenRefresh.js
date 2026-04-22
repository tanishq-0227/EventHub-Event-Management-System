import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectAccessToken, setCredentials, logout } from '../features/auth/authSlice';
import { useRefreshTokenMutation } from '../features/auth/authApi';

/**
 * useTokenRefresh - Proactively refreshes the access token before it expires
 * Access tokens expire every 15 minutes, so we refresh at 14 minutes
 */
export function useTokenRefresh() {
  const dispatch = useDispatch();
  const accessToken = useSelector(selectAccessToken);
  const [refreshToken, { isLoading }] = useRefreshTokenMutation();
  const refreshTimeoutRef = useRef(null);

  const scheduleRefresh = (token) => {
    if (!token) return;

    try {
      // Decode JWT to get expiration time
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      const timeUntilExpiry = expirationTime - currentTime;
      
      // Refresh 1 minute before expiry (15 min - 1 min = 14 min)
      const refreshTime = Math.max(timeUntilExpiry - 60000, 30000); // At least 30 seconds
      
      console.log(`🔄 Scheduling token refresh in ${Math.round(refreshTime / 1000)} seconds`);
      
      refreshTimeoutRef.current = setTimeout(async () => {
        try {
          console.log('🔄 Proactively refreshing access token...');
          const result = await refreshToken().unwrap();
          const newToken = result?.accessToken || result?.data?.accessToken;
          
          if (newToken) {
            dispatch(setCredentials({ accessToken: newToken }));
            console.log('✅ Proactive token refresh successful');
            // Schedule next refresh
            scheduleRefresh(newToken);
          } else {
            throw new Error('No access token received');
          }
        } catch (error) {
          console.error('❌ Proactive token refresh failed:', error);
          dispatch(logout());
        }
      }, refreshTime);
    } catch (error) {
      console.error('❌ Failed to decode token for refresh scheduling:', error);
    }
  };

  useEffect(() => {
    // Clear any existing timeout
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    // Schedule refresh if we have a token
    if (accessToken && !isLoading) {
      scheduleRefresh(accessToken);
    }

    // Cleanup on unmount
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [accessToken, isLoading, refreshToken, dispatch]);

  return { isLoading };
}
