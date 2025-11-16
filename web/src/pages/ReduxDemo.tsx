import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { decrement, increment, incrementByAmount, reset, selectCount } from '@/store/slices/counterSlice'

function ReduxDemo() {
  const count = useAppSelector(selectCount)
  const dispatch = useAppDispatch()

  return (
    <div className="container mx-auto p-8 space-y-8">
      <h1 className="text-4xl font-bold mb-8">Redux Store Demo</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Counter State</CardTitle>
          <CardDescription>
            This demonstrates Redux Toolkit state management with typed hooks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-6xl font-bold mb-4">{count}</p>
            <p className="text-muted-foreground">Current count value</p>
          </div>
          
          <div className="flex flex-wrap gap-4 justify-center">
            <Button onClick={() => dispatch(increment())}>
              Increment
            </Button>
            <Button onClick={() => dispatch(decrement())}>
              Decrement
            </Button>
            <Button 
              onClick={() => dispatch(incrementByAmount(5))}
              variant="secondary"
            >
              Add 5
            </Button>
            <Button 
              onClick={() => dispatch(reset())}
              variant="destructive"
            >
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Redux Features Verified</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>✓ Redux Toolkit store configured</li>
            <li>✓ Redux DevTools integration enabled</li>
            <li>✓ Typed hooks (useAppDispatch, useAppSelector) working</li>
            <li>✓ Slice reducer with actions functioning correctly</li>
            <li>✓ TypeScript type safety throughout</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

export default ReduxDemo

