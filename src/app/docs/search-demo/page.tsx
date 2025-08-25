import { Metadata } from 'next';
import { DocsSearch } from '@/components/docs/docs-search';
import { SearchShortcut } from '@/components/docs/search-shortcut';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Search Demo | GreekDash Documentation',
  description: 'Test the search functionality',
};

export default function SearchDemoPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Search Demo</h1>
        <p className="text-xl text-muted-foreground">
          Test the documentation search functionality
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Basic Search</CardTitle>
            <CardDescription>
              Search with real-time results dropdown
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DocsSearch placeholder="Try searching for 'member'..." />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Search Shortcut</CardTitle>
            <CardDescription>
              Search with keyboard shortcut (Cmd/Ctrl + K)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SearchShortcut />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Features</CardTitle>
          <CardDescription>
            The search functionality includes the following features:
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-semibold mb-2">Real-time Search</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Instant results as you type</li>
                <li>• Debounced queries for performance</li>
                <li>• Loading states and error handling</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Keyboard Navigation</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Arrow keys to navigate results</li>
                <li>• Enter to select result</li>
                <li>• Escape to close dropdown</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Search Analytics</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Track popular queries</li>
                <li>• Monitor search success rates</li>
                <li>• Identify content gaps</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Advanced Features</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Filtering by section and type</li>
                <li>• Relevance scoring</li>
                <li>• Contextual excerpts</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Try These Searches</CardTitle>
          <CardDescription>
            Test queries to see how the search works (note: results depend on available content)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {[
              'member management',
              'dues collection',
              'event creation',
              'financial reports',
              'chapter settings',
              'getting started',
              'admin guide',
              'security'
            ].map(query => (
              <div key={query} className="p-2 bg-muted rounded text-sm font-mono">
                {query}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}