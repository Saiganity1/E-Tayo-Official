"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ApplicantTemplatesPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/applicant/dashboard");
  }, [router]);

  return null;
}
