import { redirect } from '@remix-run/node';
import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import InsuranceTestComponent from '../../components/test/InsuranceTestComponent';

/**
 * Route metadata
 */
export const meta: MetaFunction = () => {
  return [
    { title: 'Insurance Chat Test Interface' },
    { name: 'description', content: 'Test interface for the insurance chat functionality' },
    { name: 'robots', content: 'noindex, nofollow' } // Prevent indexing of test routes
  ];
};

/**
 * Loader function to protect the route in production
 */
export async function loader({ request }: LoaderFunctionArgs) {
  // Check if we're in production mode
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Get the URL to check for a test token
  const url = new URL(request.url);
  const hasToken = url.searchParams.has('test_token');
  const testToken = url.searchParams.get('test_token');
  const validToken = process.env.TEST_ACCESS_TOKEN || 'test123'; // Fallback to a default for development
  
  // Restrict access in production to only those with a valid test token
  if (isProduction && (!hasToken || testToken !== validToken)) {
    // Redirect to home page if unauthorized in production
    return redirect('/');
  }
  
  // Allow access in development or with valid token in production
  return { 
    isTest: true,
    env: process.env.NODE_ENV || 'development'
  };
}

/**
 * Test route for insurance chat functionality
 */
export default function InsuranceChatTestRoute() {
  return (
    <div className="test-container">
      <InsuranceTestComponent />
      
      {/* Warning banner for test environment */}
      <div className="fixed top-0 left-0 right-0 bg-red-600 text-white text-center py-1 text-xs font-bold z-50">
        TEST ENVIRONMENT - NOT FOR PRODUCTION USE
      </div>
    </div>
  );
}

