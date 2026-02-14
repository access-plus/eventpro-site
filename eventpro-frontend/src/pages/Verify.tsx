import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";

const Verify = () => {
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="text-center">
          <CardHeader>
            <CardTitle>Verify Your Email</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Please check your email for a verification link to complete your registration.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Verify;
