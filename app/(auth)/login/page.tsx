import Link from "next/link";
import { AuthLayout } from "../../components/AuthLayout";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

export default function LoginPage() {
  return (
    <AuthLayout title="Welcome back">
      <form className="space-y-6 w-full max-w-sm mx-auto md:mx-0">
        <div className="space-y-4">
          <Input 
            type="email" 
            placeholder="Email" 
            required 
          />
          <Input 
            type="password" 
            placeholder="Password" 
            required 
          />
        </div>

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center space-x-2 cursor-pointer text-gray-600">
            <input 
              type="checkbox" 
              className="w-4 h-4 rounded border-gray-300 text-[#F5A9B8] focus:ring-[#F5A9B8]" 
            />
            <span>Remember Me</span>
          </label>
          <Link 
            href="/forgot-password" 
            className="text-gray-500 hover:text-gray-700"
          >
            Forgot your password?
          </Link>
        </div>

        <Button fullWidth className="mt-8">
          Login
        </Button>

        <div className="text-center mt-6">
          <Link 
            href="/signup" 
            className="text-sm text-gray-500 hover:text-gray-800 underline underline-offset-4"
          >
            Don't you have an account?
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
