import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Verify = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-secondary/30">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">No Email Verification Required</CardTitle>
          <CardDescription>
            Email verification is disabled for now. You can log in immediately after signing up.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link to="/login">
            <Button className="w-full bg-gradient-primary">Go to Login</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};

export default Verify;
