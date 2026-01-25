import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Link } from 'wouter';

export default function ApiDocs() {
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);

  const copyToClipboard = (text: string, endpoint: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEndpoint(endpoint);
    setTimeout(() => setCopiedEndpoint(null), 2000);
  };

  const baseUrl = window.location.origin + '/api';

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto flex items-center justify-between py-4">
          <Link href="/inventory">
            <img src="/logo.png" alt="Earth Wind and Fire" className="h-10 cursor-pointer" />
          </Link>
          <h1 className="text-2xl font-bold">API Documentation</h1>
        </div>
      </header>

      <div className="container mx-auto py-8 max-w-5xl">
        {/* Introduction */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Inventory Management REST API</CardTitle>
            <CardDescription>
              Complete API reference for the Earth Wind and Fire Inventory Management system.
              All endpoints require authentication via Bearer token except where noted.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Base URL</h3>
              <div className="flex items-center gap-2">
                <code className="bg-gray-100 px-3 py-2 rounded flex-1">{baseUrl}</code>
                <button
                  onClick={() => copyToClipboard(baseUrl, 'base')}
                  className="px-3 py-2 bg-[#8B7355] text-white rounded hover:bg-[#6d5a43]"
                >
                  {copiedEndpoint === 'base' ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Authentication</h3>
              <p className="text-sm text-gray-600 mb-2">
                Include the JWT token in the Authorization header for all authenticated requests:
              </p>
              <code className="bg-gray-100 px-3 py-2 rounded block">
                Authorization: Bearer YOUR_TOKEN_HERE
              </code>
            </div>
          </CardContent>
        </Card>

        {/* Endpoints */}
        <Tabs defaultValue="auth" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="auth">Authentication</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
          </TabsList>

          {/* Authentication Endpoints */}
          <TabsContent value="auth" className="space-y-4">
            {/* Login */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-600">POST</Badge>
                  <code className="text-sm">/auth/login</code>
                </div>
                <CardTitle className="text-lg">Login</CardTitle>
                <CardDescription>
                  Authenticate with email and password to receive a JWT token.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Request Body</h4>
                  <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-sm">
{`{
  "email": "admin@ewandf.ca",
  "password": "your-password"
}`}
                  </pre>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Response (200 OK)</h4>
                  <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-sm">
{`{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "admin@ewandf.ca",
    "name": "Admin User",
    "role": "admin"
  }
}`}
                  </pre>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Error Responses</h4>
                  <ul className="text-sm space-y-1 text-gray-600">
                    <li><code>400</code> - Missing email or password</li>
                    <li><code>401</code> - Invalid email or password</li>
                    <li><code>500</code> - Internal server error</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Get Current User */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-600">GET</Badge>
                  <code className="text-sm">/auth/me</code>
                </div>
                <CardTitle className="text-lg">Get Current User</CardTitle>
                <CardDescription>
                  Retrieve the currently authenticated user's information. Requires authentication.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Response (200 OK)</h4>
                  <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-sm">
{`{
  "id": 1,
  "openId": "user-openid",
  "email": "admin@ewandf.ca",
  "name": "Admin User",
  "role": "admin",
  "createdAt": "2025-01-25T00:00:00.000Z",
  "updatedAt": "2025-01-25T00:00:00.000Z",
  "lastSignedIn": "2025-01-25T00:00:00.000Z"
}`}
                  </pre>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Error Responses</h4>
                  <ul className="text-sm space-y-1 text-gray-600">
                    <li><code>401</code> - No token provided or invalid token</li>
                    <li><code>404</code> - User not found</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Logout */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-600">POST</Badge>
                  <code className="text-sm">/auth/logout</code>
                </div>
                <CardTitle className="text-lg">Logout</CardTitle>
                <CardDescription>
                  Invalidate the current session. Requires authentication.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Response (200 OK)</h4>
                  <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-sm">
{`{
  "success": true
}`}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Inventory Endpoints */}
          <TabsContent value="inventory" className="space-y-4">
            {/* List Inventory */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-600">GET</Badge>
                  <code className="text-sm">/inventory</code>
                </div>
                <CardTitle className="text-lg">List Inventory Items</CardTitle>
                <CardDescription>
                  Retrieve all inventory items with optional filtering. Requires authentication.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Query Parameters</h4>
                  <ul className="text-sm space-y-2 text-gray-600">
                    <li><code>category</code> (optional) - Filter by category</li>
                    <li><code>q</code> (optional) - Search by product code or description</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Example Request</h4>
                  <code className="bg-gray-100 px-3 py-2 rounded block text-sm">
                    GET /inventory?category=Batteries&q=9V
                  </code>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Response (200 OK)</h4>
                  <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-sm">
{`[
  {
    "id": "uuid-here",
    "productCode": "BAT-9V-ALK",
    "description": "9V Alkaline Battery",
    "quantity": 50,
    "cost": 3.50,
    "category": "Batteries",
    "updatedAt": "2026-01-25T09:00:00.000Z"
  }
]`}
                  </pre>
                </div>
              </CardContent>
            </Card>

            {/* Get Single Item */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-600">GET</Badge>
                  <code className="text-sm">/inventory/:id</code>
                </div>
                <CardTitle className="text-lg">Get Inventory Item</CardTitle>
                <CardDescription>
                  Retrieve a single inventory item by ID. Requires authentication.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Response (200 OK)</h4>
                  <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-sm">
{`{
  "id": "uuid-here",
  "productCode": "BAT-9V-ALK",
  "description": "9V Alkaline Battery",
  "quantity": 50,
  "cost": 3.50,
  "category": "Batteries",
  "updatedAt": "2026-01-25T09:00:00.000Z"
}`}
                  </pre>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Error Responses</h4>
                  <ul className="text-sm space-y-1 text-gray-600">
                    <li><code>404</code> - Item not found</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Create Item */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-600">POST</Badge>
                  <code className="text-sm">/inventory</code>
                </div>
                <CardTitle className="text-lg">Create Inventory Item</CardTitle>
                <CardDescription>
                  Add a new inventory item. Requires admin role.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Request Body</h4>
                  <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-sm">
{`{
  "productCode": "NEW-ITEM-001",
  "description": "New Product Description",
  "quantity": 10,
  "cost": 25.00,
  "category": "Miscellaneous"
}`}
                  </pre>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Response (201 Created)</h4>
                  <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-sm">
{`{
  "success": true
}`}
                  </pre>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Error Responses</h4>
                  <ul className="text-sm space-y-1 text-gray-600">
                    <li><code>400</code> - Missing required fields</li>
                    <li><code>403</code> - Admin access required</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Update Item */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Badge className="bg-yellow-600">PATCH</Badge>
                  <code className="text-sm">/inventory/:id</code>
                </div>
                <CardTitle className="text-lg">Update Inventory Item</CardTitle>
                <CardDescription>
                  Update an existing inventory item. Requires admin role.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Request Body (all fields optional)</h4>
                  <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-sm">
{`{
  "productCode": "UPDATED-CODE",
  "description": "Updated Description",
  "quantity": 20,
  "cost": 30.00,
  "category": "New Category"
}`}
                  </pre>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Response (200 OK)</h4>
                  <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-sm">
{`{
  "success": true
}`}
                  </pre>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Error Responses</h4>
                  <ul className="text-sm space-y-1 text-gray-600">
                    <li><code>403</code> - Admin access required</li>
                    <li><code>404</code> - Item not found</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Categories Reference */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Available Categories</CardTitle>
            <CardDescription>
              Valid category values for inventory items
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <code className="bg-gray-100 px-2 py-1 rounded">Fire Extinguishers and accessories</code>
              <code className="bg-gray-100 px-2 py-1 rounded">Emergency Light Packs and accessories</code>
              <code className="bg-gray-100 px-2 py-1 rounded">Batteries</code>
              <code className="bg-gray-100 px-2 py-1 rounded">Steel Fittings</code>
              <code className="bg-gray-100 px-2 py-1 rounded">Couplings</code>
              <code className="bg-gray-100 px-2 py-1 rounded">Smoke Alarms</code>
              <code className="bg-gray-100 px-2 py-1 rounded">Heat Detectors</code>
              <code className="bg-gray-100 px-2 py-1 rounded">Smoke Detectors</code>
              <code className="bg-gray-100 px-2 py-1 rounded">Backflow</code>
              <code className="bg-gray-100 px-2 py-1 rounded">Indicating Devices (Pull Stations, Strobes, Buzzers etc)</code>
              <code className="bg-gray-100 px-2 py-1 rounded">Miscellaneous</code>
            </div>
          </CardContent>
        </Card>

        {/* Roles Reference */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>User Roles & Permissions</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Role</th>
                  <th className="text-left py-2">Permissions</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2"><Badge>admin</Badge></td>
                  <td className="py-2">Full access: create, read, update, delete inventory items</td>
                </tr>
                <tr>
                  <td className="py-2"><Badge variant="outline">tech</Badge></td>
                  <td className="py-2">Read-only access: view inventory items, search, and filter</td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
