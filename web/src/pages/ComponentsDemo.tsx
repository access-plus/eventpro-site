import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

function ComponentsDemo() {
  return (
    <div className="container mx-auto p-8 space-y-8">
      <h1 className="text-4xl font-bold mb-8">shadcn/ui Components Demo</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Button Components</CardTitle>
          <CardDescription>Various button variants from shadcn/ui</CardDescription>
        </CardHeader>
        <CardContent className="space-x-4">
          <Button>Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Input Component</CardTitle>
          <CardDescription>Input field from shadcn/ui</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input type="text" placeholder="Enter your name" />
          <Input type="email" placeholder="Enter your email" />
          <Input type="password" placeholder="Enter your password" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Card Component</CardTitle>
          <CardDescription>This card demonstrates the Card component itself</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            All components are working correctly with Tailwind CSS and shadcn/ui!
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default ComponentsDemo

