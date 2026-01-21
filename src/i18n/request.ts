import { getRequestConfig } from 'next-intl/server';
import { headers } from 'next/headers';

export default getRequestConfig(async () => {
  // Get locale from cookie or default to 'en'
  const headersList = await headers();
  const cookieHeader = headersList.get('cookie');
  
  // Parse locale from cookie
  let locale = 'en';
  if (cookieHeader) {
    const localeCookie = cookieHeader.split(';').find(c => c.trim().startsWith('NEXT_LOCALE='));
    if (localeCookie) {
      locale = localeCookie.split('=')[1];
    }
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});
