import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Mail } from "lucide-react";

const verifySchema = z.object({
  code: z.string().length(6, "Verification code must be 6 digits"),
});

type VerifyForm = z.infer<typeof verifySchema>;

const Verify = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { verifyEmail } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VerifyForm>({
    resolver: zodResolver(verifySchema),
  });

  const onSubmit = async (data: VerifyForm) => {
    if (!email) {
      navigate("/signup");
      return;
    }

    setIsLoading(true);
    try {
      await verifyEmail({ email, code: data.code });
      navigate("/login");
    } catch (error) {
      console.error("Verification error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>No Email Found</CardTitle>
            <CardDescription>Please sign up first</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/signup">
              <Button className="w-full">Go to Sign Up</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-secondary/30">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto h-12 w-12 rounded-lg bg-gradient-primary flex items-center justify-center mb-4">
            <Mail className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">Verify your email</CardTitle>
          <CardDescription>
            We've sent a verification code to <strong>{email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Verification Code</Label>
              <Input
                id="code"
                {...register("code")}
                placeholder="123456"
                maxLength={6}
                className="text-center text-2xl tracking-widest"
              />
              {errors.code && (
                <p className="text-sm text-destructive">{errors.code.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-primary"
              disabled={isLoading}
            >
              {isLoading ? "Verifying..." : "Verify Email"}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-muted-foreground">
            Didn't receive the code? Check your spam folder or{" "}
            <Link to="/signup" className="text-primary hover:underline font-medium">
              try signing up again
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Verify;
