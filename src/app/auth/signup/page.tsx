'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../../lib/firebase/client';

const schema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  contact: z.string().min(9),
  password: z.string().min(6),
  confirmPassword: z.string(),
  role: z.enum(['patient', 'doctor']),
  // conditional fields...
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof schema>;

export default function SignupPage() {
  const router = useRouter();
  const [role, setRole] = useState<'patient' | 'doctor'>('patient');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'patient' }
  });

  const onSubmit = async (data: FormData) => {
    try {
      const { user } = await createUserWithEmailAndPassword(auth, data.email, data.password);
      await sendEmailVerification(user);

      await setDoc(doc(db, "users", data.email.toLowerCase()), {
        uid: user.uid,
        fullName: data.fullName,
        email: data.email.toLowerCase(),
        contact: data.contact,
        role: data.role,
        createdAt: serverTimestamp(),
        verified: false,
        ...(data.role === 'patient' ? { dob: '', emergencyContact: '' } : { license: '', specialization: '' })
      });

      alert("Account created! Check email for verification.");
      router.push("/login");
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      alert(error.message || "Something went wrong");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-xl p-8 bg-white dark:bg-slate-900 rounded-2xl shadow-xl">
        <h1 className="text-3xl font-bold text-center mb-8">Create Account</h1>

        {/* Role selector */}
        <div className="flex justify-center mb-8">
          {/* your nice toggle buttons here */}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Your fields with react-hook-form */}
          {/* ... */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-60"
          >
            {isSubmitting ? "Creating..." : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}