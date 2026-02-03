"use client";
import { useState } from "react";
import Link from "next/link";
import { AuthLayout } from "../../components/AuthLayout";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

export default function SignupPage() {
  const [role, setRole] = useState<"student" | "teacher">("student");

  return (
    <AuthLayout title="Create an account">
      <form className="space-y-6 w-full max-w-sm mx-auto md:mx-0">
        <div className="space-y-4">
          <Input 
            type="text" 
            placeholder="Full name" 
            required 
          />
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

        {/* Role Toggle */}
        <div className="flex bg-gray-200 p-1 rounded-md">
          <button
            type="button"
            onClick={() => setRole("student")}
            className={`flex-1 py-2 text-sm font-medium rounded-sm transition-all ${
              role === "student" 
                ? "bg-[#F5A9B8] text-white shadow-sm" 
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Student
          </button>
          <button
            type="button"
            onClick={() => setRole("teacher")}
            className={`flex-1 py-2 text-sm font-medium rounded-sm transition-all ${
              role === "teacher" 
                ? "bg-[#F5A9B8] text-white shadow-sm" 
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Teacher
          </button>
        </div>

        <Button fullWidth className="mt-4">
          Create an account
        </Button>

        <div className="text-center mt-6">
          <Link 
            href="/login" 
            className="text-sm text-gray-500 hover:text-gray-800 underline underline-offset-4"
          >
            Already you have an account?
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
